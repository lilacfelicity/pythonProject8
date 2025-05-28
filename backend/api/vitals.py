from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from database import get_db
from models import User, Device, HeartData
from services.redis_service import redis_service
from services.iot_service import iot_service
from api.auth import get_current_user

router = APIRouter()


class VitalData(BaseModel):
    device_id: str
    heart_rate: Optional[int] = None
    spo2: Optional[float] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    temperature: Optional[float] = None


class IoTData(BaseModel):
    device_id: str
    data: dict


@router.post("/")
async def add_vitals(
        vital_data: VitalData,
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db)
):
    """Add vital signs from device"""
    data = {
        "heart_rate": vital_data.heart_rate,
        "spo2": vital_data.spo2,
        "bp_systolic": vital_data.blood_pressure_systolic,
        "bp_diastolic": vital_data.blood_pressure_diastolic,
        "temperature": vital_data.temperature
    }

    success = await iot_service.process_device_data(
        vital_data.device_id,
        {"vitals": data},
        db
    )

    if not success:
        raise HTTPException(status_code=400, detail="Failed to process data")

    return {"status": "success", "message": "Vitals recorded"}


@router.post("/iot")
async def receive_iot_data(
        iot_data: IoTData,
        db: Session = Depends(get_db)
):
    """Receive raw IoT device data"""
    success = await iot_service.process_device_data(
        iot_data.device_id,
        iot_data.data,
        db
    )

    if not success:
        raise HTTPException(status_code=400, detail="Failed to process IoT data")

    return {"status": "success", "message": "IoT data processed"}


@router.get("/latest")
async def get_latest_vitals(
        current_user: User = Depends(get_current_user)
):
    """Get latest vital signs"""
    latest = await redis_service.get_latest_vitals(current_user.id)
    return {"vitals": latest}


@router.get("/history/{vital_type}")
async def get_vital_history(
        vital_type: str,
        hours: int = 24,
        current_user: User = Depends(get_current_user)
):
    """Get vital sign history"""
    valid_types = ["heart_rate", "blood_pressure", "spo2", "temperature"]
    if vital_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid vital type. Use: {valid_types}")

    history = await redis_service.get_vitals(current_user.id, vital_type, hours)
    return {
        "vital_type": vital_type,
        "hours": hours,
        "data": history
    }


@router.get("/alerts")
async def get_alerts(
        limit: int = 20,
        current_user: User = Depends(get_current_user)
):
    """Get recent alerts"""
    alerts = await redis_service.get_alerts(current_user.id, limit)
    return {"alerts": alerts}


@router.get("/dashboard")
async def get_vitals_dashboard(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Get vitals dashboard data"""
    # Get from cache first
    cache_key = f"vitals_dashboard:{current_user.id}"
    cached = await redis_service.cache_get(cache_key)
    if cached:
        return cached

    # Get latest vitals
    latest_vitals = await redis_service.get_latest_vitals(current_user.id)

    # Get 24h summaries
    summaries = {}
    for vital_type in ["heart_rate", "blood_pressure", "spo2", "temperature"]:
        history = await redis_service.get_vitals(current_user.id, vital_type, 24)
        if history:
            values = [h["value"] for h in history]
            summaries[vital_type] = {
                "avg": round(sum(values) / len(values), 1),
                "min": min(values),
                "max": max(values),
                "count": len(values)
            }

    # Get alerts count
    alerts = await redis_service.get_alerts(current_user.id, 50)
    critical_count = len([a for a in alerts if a.get("type") == "critical"])
    warning_count = len([a for a in alerts if a.get("type") == "warning"])

    dashboard = {
        "latest": latest_vitals,
        "summaries": summaries,
        "alerts": {
            "critical": critical_count,
            "warning": warning_count,
            "total": len(alerts)
        },
        "timestamp": datetime.now().isoformat()
    }

    # Cache for 1 minute
    await redis_service.cache_set(cache_key, dashboard, 60)

    return dashboard