from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Optional

from database import get_db
from models import User, Device, HeartData
from api.auth import get_current_user
from services.redis_service import redis_service

router = APIRouter()


@router.get("/summary")
async def get_analytics_summary(
        days: int = Query(7, ge=1, le=90),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    start_date = datetime.now() - timedelta(days=days)

    # Get aggregated data
    result = db.query(
        func.count(HeartData.id).label('total_readings'),
        func.avg(HeartData.heart_rate).label('avg_heart_rate'),
        func.min(HeartData.heart_rate).label('min_heart_rate'),
        func.max(HeartData.heart_rate).label('max_heart_rate'),
        func.avg(HeartData.spo2).label('avg_spo2'),
        func.min(HeartData.spo2).label('min_spo2'),
        func.avg(HeartData.temperature).label('avg_temperature'),
        func.avg(HeartData.blood_pressure_systolic).label('avg_bp_systolic')
    ).join(Device).filter(
        Device.user_id == current_user.id,
        HeartData.timestamp >= start_date
    ).first()

    # Count anomalies
    anomalies = db.query(HeartData).join(Device).filter(
        Device.user_id == current_user.id,
        HeartData.timestamp >= start_date,
        (
                (HeartData.heart_rate > 100) |
                (HeartData.heart_rate < 60) |
                (HeartData.spo2 < 95) |
                (HeartData.blood_pressure_systolic > 140)
        )
    ).count()

    return {
        "period_days": days,
        "total_readings": result.total_readings or 0,
        "anomalies_count": anomalies,
        "heart_rate": {
            "average": round(result.avg_heart_rate or 0, 1),
            "min": result.min_heart_rate or 0,
            "max": result.max_heart_rate or 0
        },
        "spo2": {
            "average": round(result.avg_spo2 or 0, 1),
            "min": result.min_spo2 or 0
        },
        "temperature": {
            "average": round(result.avg_temperature or 0, 1)
        },
        "blood_pressure": {
            "systolic_avg": round(result.avg_bp_systolic or 0, 1)
        }
    }


@router.get("/trends")
async def get_trends(
        metric: str = Query(..., regex="^(heart_rate|spo2|temperature|blood_pressure)$"),
        hours: int = Query(24, ge=1, le=168),
        current_user: User = Depends(get_current_user)
):
    # Get data from Redis
    data = await redis_service.get_vitals(current_user.id, metric, hours)

    if not data:
        return {"metric": metric, "hours": hours, "data": []}

    # Calculate trend
    if len(data) >= 2:
        values = [d["value"] for d in data]
        first_half_avg = sum(values[:len(values) // 2]) / (len(values) // 2)
        second_half_avg = sum(values[len(values) // 2:]) / (len(values) - len(values) // 2)
        trend = "increasing" if second_half_avg > first_half_avg else "decreasing"
        change_percent = ((second_half_avg - first_half_avg) / first_half_avg) * 100
    else:
        trend = "stable"
        change_percent = 0

    return {
        "metric": metric,
        "hours": hours,
        "data_points": len(data),
        "trend": trend,
        "change_percent": round(change_percent, 1),
        "data": data[-100:]  # Limit to last 100 points
    }


@router.get("/hourly")
async def get_hourly_aggregates(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    # Check if we have hourly_vitals_summary table
    query = """
    SELECT 
        hour_timestamp,
        readings_count,
        heart_rate_avg,
        spo2_avg,
        temperature_avg,
        bp_systolic_avg
    FROM hourly_vitals_summary
    WHERE user_id = :user_id
      AND hour_timestamp >= :start_time
    ORDER BY hour_timestamp DESC
    LIMIT 24
    """

    try:
        result = db.execute(
            query,
            {
                "user_id": current_user.id,
                "start_time": datetime.now() - timedelta(hours=24)
            }
        ).fetchall()

        return {
            "hourly_data": [
                {
                    "hour": row.hour_timestamp.isoformat(),
                    "readings": row.readings_count,
                    "heart_rate_avg": round(row.heart_rate_avg or 0, 1),
                    "spo2_avg": round(row.spo2_avg or 0, 1),
                    "temperature_avg": round(row.temperature_avg or 0, 1),
                    "bp_systolic_avg": round(row.bp_systolic_avg or 0, 1)
                }
                for row in result
            ]
        }
    except:
        # Table doesn't exist yet
        return {"hourly_data": [], "message": "Hourly aggregation not available yet"}


@router.get("/devices/stats")
async def get_device_stats(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    # Get device statistics
    devices = db.query(Device).filter(
        Device.user_id == current_user.id
    ).all()

    device_stats = []

    for device in devices:
        readings_count = db.query(HeartData).filter(
            HeartData.device_id == device.id,
            HeartData.timestamp >= datetime.now() - timedelta(days=7)
        ).count()

        last_reading = db.query(HeartData).filter(
            HeartData.device_id == device.id
        ).order_by(HeartData.timestamp.desc()).first()

        device_stats.append({
            "device_id": device.device_id,
            "device_name": device.name,
            "status": device.status.value,
            "readings_week": readings_count,
            "last_reading": last_reading.timestamp.isoformat() if last_reading else None,
            "is_active": device.last_seen and device.last_seen > datetime.now() - timedelta(minutes=30)
        })

    return {
        "total_devices": len(devices),
        "active_devices": sum(1 for d in device_stats if d["is_active"]),
        "devices": device_stats
    }