from typing import Dict, Optional, List
from datetime import datetime
import logging
from sqlalchemy.orm import Session

from models import Device, HeartData, DeviceStatus
from services.redis_service import redis_service
from services.alert_service import alert_service
from core.websocket import manager

logger = logging.getLogger(__name__)


class IoTService:

    async def process_device_data(self, device_id: str, data: dict, db: Session):
        """Process incoming IoT device data"""
        device = db.query(Device).filter(Device.device_id == device_id).first()
        if not device:
            logger.error(f"Unknown device: {device_id}")
            return False

        # Update device last seen
        device.last_seen = datetime.now()

        # Process vital signs
        vital_data = await self._extract_vitals(data)
        if not vital_data:
            return False

        # Store in database
        heart_data = HeartData(
            device_id=device.id,
            heart_rate=vital_data.get("heart_rate"),
            spo2=vital_data.get("spo2"),
            blood_pressure_systolic=vital_data.get("bp_systolic"),
            blood_pressure_diastolic=vital_data.get("bp_diastolic"),
            temperature=vital_data.get("temperature"),
            timestamp=datetime.now()
        )

        db.add(heart_data)
        db.commit()

        # Store in Redis for real-time
        user_id = device.user_id
        for vital_type, value in vital_data.items():
            if value is not None:
                await redis_service.store_vital(device_id, user_id, vital_type, value)

        # Check for alerts
        alerts = await self._check_vital_alerts(user_id, vital_data)
        for alert in alerts:
            await alert_service.send_alert(user_id, alert)
            await manager.broadcast_alert(user_id, alert)

        # Broadcast update to connected clients
        await manager.broadcast_vital_update(user_id, vital_data)

        logger.info(f"Processed data from device {device_id}")
        return True

    async def _extract_vitals(self, data: dict) -> dict:
        """Extract vital signs from device data"""
        # Handle different device formats
        vitals = {}

        # Standard format
        if "vitals" in data:
            vitals = data["vitals"]
        # Arduino format
        elif "HR" in data or "heart_rate" in data:
            vitals["heart_rate"] = data.get("HR") or data.get("heart_rate")
            vitals["spo2"] = data.get("SPO2") or data.get("spo2")
            vitals["temperature"] = data.get("TEMP") or data.get("temperature")
            vitals["bp_systolic"] = data.get("BPS") or data.get("bp_systolic")
            vitals["bp_diastolic"] = data.get("BPD") or data.get("bp_diastolic")
        # Generic sensor data
        else:
            vitals = {
                "heart_rate": data.get("pulse"),
                "spo2": data.get("oxygen"),
                "temperature": data.get("temp"),
                "bp_systolic": data.get("sys"),
                "bp_diastolic": data.get("dia")
            }

        # Clean up None values
        return {k: v for k, v in vitals.items() if v is not None}

    async def _check_vital_alerts(self, user_id: int, vitals: dict) -> List[dict]:
        """Check vitals for alert conditions"""
        alerts = []
        timestamp = datetime.now().isoformat()

        # Heart rate
        hr = vitals.get("heart_rate")
        if hr:
            if hr > 120:
                alerts.append({
                    "type": "critical",
                    "metric": "heart_rate",
                    "value": hr,
                    "message": f"Critical: Heart rate {hr} bpm",
                    "threshold": 120,
                    "timestamp": timestamp
                })
            elif hr > 100:
                alerts.append({
                    "type": "warning",
                    "metric": "heart_rate",
                    "value": hr,
                    "message": f"High heart rate: {hr} bpm",
                    "threshold": 100,
                    "timestamp": timestamp
                })
            elif hr < 50:
                alerts.append({
                    "type": "warning",
                    "metric": "heart_rate",
                    "value": hr,
                    "message": f"Low heart rate: {hr} bpm",
                    "threshold": 50,
                    "timestamp": timestamp
                })

        # Blood pressure
        bp_sys = vitals.get("bp_systolic")
        if bp_sys:
            if bp_sys > 180:
                alerts.append({
                    "type": "critical",
                    "metric": "blood_pressure",
                    "value": bp_sys,
                    "message": f"Critical: Systolic BP {bp_sys}",
                    "threshold": 180,
                    "timestamp": timestamp
                })
            elif bp_sys > 140:
                alerts.append({
                    "type": "warning",
                    "metric": "blood_pressure",
                    "value": bp_sys,
                    "message": f"High blood pressure: {bp_sys}",
                    "threshold": 140,
                    "timestamp": timestamp
                })

        # SpO2
        spo2 = vitals.get("spo2")
        if spo2:
            if spo2 < 90:
                alerts.append({
                    "type": "critical",
                    "metric": "spo2",
                    "value": spo2,
                    "message": f"Critical: Low oxygen {spo2}%",
                    "threshold": 90,
                    "timestamp": timestamp
                })
            elif spo2 < 95:
                alerts.append({
                    "type": "warning",
                    "metric": "spo2",
                    "value": spo2,
                    "message": f"Low oxygen saturation: {spo2}%",
                    "threshold": 95,
                    "timestamp": timestamp
                })

        # Temperature
        temp = vitals.get("temperature")
        if temp:
            if temp > 39.0:
                alerts.append({
                    "type": "critical",
                    "metric": "temperature",
                    "value": temp,
                    "message": f"High fever: {temp}°C",
                    "threshold": 39.0,
                    "timestamp": timestamp
                })
            elif temp > 37.5:
                alerts.append({
                    "type": "warning",
                    "metric": "temperature",
                    "value": temp,
                    "message": f"Elevated temperature: {temp}°C",
                    "threshold": 37.5,
                    "timestamp": timestamp
                })

        return alerts


iot_service = IoTService()