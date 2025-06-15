from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import Optional, List

from database import get_db
from models import User, Device, HeartData, LabTest, BloodCount, Biochemistry, ThyroidPanel, VitaminLevels, LipidPanel
from api.auth import get_current_user
from services.redis_service import redis_service

router = APIRouter()


@router.get("/summary")
async def get_analytics_summary(
        period_days: int = Query(365, ge=1, le=365),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    start_date = datetime.now() - timedelta(days=period_days)

    # Подсчитываем общие показания
    vitals_count = db.query(HeartData).join(Device).filter(
        Device.user_id == current_user.id,
        HeartData.timestamp >= start_date
    ).count()

    # Подсчитываем лабораторные тесты
    lab_tests_count = db.query(LabTest).filter(
        LabTest.patient_id == current_user.id,
        LabTest.test_date >= start_date
    ).count()

    # Подсчитываем аномалии в витальных функциях
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

    # Последняя дата тестирования
    last_test = db.query(LabTest).filter(
        LabTest.patient_id == current_user.id
    ).order_by(desc(LabTest.test_date)).first()

    return {
        "period_days": period_days,
        "total_readings": vitals_count + lab_tests_count,
        "lab_tests_count": lab_tests_count,
        "vitals_count": vitals_count,
        "anomalies_count": anomalies,
        "last_reading_date": last_test.test_date.strftime("%d.%m.%Y") if last_test else None
    }


@router.get("/lab-data")
async def get_lab_data(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Получение всех лабораторных данных пациента"""

    # Получаем все лабораторные тесты пациента
    lab_tests = db.query(LabTest).filter(
        LabTest.patient_id == current_user.id
    ).order_by(desc(LabTest.test_date)).all()

    # Группируем данные по типам
    blood_tests = []
    biochemistry = []
    hormones = []
    vitamins = []
    lipids = []

    for test in lab_tests:
        test_date = test.test_date.strftime("%Y-%m-%d")

        # Общий анализ крови
        if hasattr(test, 'blood_count') and test.blood_count:
            bc = test.blood_count
            blood_tests.append({
                "date": test_date,
                "hemoglobin": bc.hemoglobin,
                "platelets": bc.platelets,
                "leukocytes": bc.leukocytes,
                "erythrocytes": bc.erythrocytes,
                "hematocrit": bc.hematocrit,
                "esr": bc.esr
            })

        # Биохимия крови
        if hasattr(test, 'biochemistry') and test.biochemistry:
            bio = test.biochemistry
            biochemistry.append({
                "date": test_date,
                "glucose": bio.glucose,
                "creatinine": bio.creatinine,
                "urea": bio.urea,
                "alt": bio.alt,
                "ast": bio.ast,
                "total_bilirubin": bio.total_bilirubin,
                "total_protein": bio.total_protein
            })

        # Гормоны щитовидной железы
        if hasattr(test, 'thyroid_panel') and test.thyroid_panel:
            tp = test.thyroid_panel
            hormones.append({
                "date": test_date,
                "tsh": tp.tsh,
                "t4_free": tp.t4_free,
                "t3_free": tp.t3_free
            })

        # Витамины
        if hasattr(test, 'vitamin_levels') and test.vitamin_levels:
            vl = test.vitamin_levels
            vitamins.append({
                "date": test_date,
                "vitamin_d": vl.vitamin_d,
                "vitamin_b12": vl.vitamin_b12,
                "ferritin": vl.ferritin,
                "iron": vl.iron
            })

        # Липиды
        if hasattr(test, 'lipid_panel') and test.lipid_panel:
            lp = test.lipid_panel
            lipids.append({
                "date": test_date,
                "cholesterol": lp.total_cholesterol,
                "hdl": lp.hdl_cholesterol,
                "ldl": lp.ldl_cholesterol,
                "triglycerides": lp.triglycerides
            })

    return {
        "bloodTests": blood_tests,
        "biochemistry": biochemistry,
        "hormones": hormones,
        "vitamins": vitamins,
        "lipids": lipids
    }


@router.get("/vitals-history")
async def get_vitals_history(
        days: int = Query(7, ge=1, le=90),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Получение истории витальных функций"""
    start_date = datetime.now() - timedelta(days=days)

    vitals = db.query(HeartData).join(Device).filter(
        Device.user_id == current_user.id,
        HeartData.timestamp >= start_date
    ).order_by(desc(HeartData.timestamp)).limit(100).all()

    return {
        "vitals": [
            {
                "date": v.timestamp.strftime("%Y-%m-%d"),
                "systolic": v.blood_pressure_systolic,
                "diastolic": v.blood_pressure_diastolic,
                "pulse": v.heart_rate,
                "spo2": v.spo2,
                "temperature": v.temperature,
                "activity_level": v.activity_level
            }
            for v in vitals
        ]
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