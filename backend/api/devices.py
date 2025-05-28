from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from pydantic import BaseModel

from database import get_db
from models import User, Device, DeviceStatus
from api.auth import get_current_user

router = APIRouter()


class DeviceCreate(BaseModel):
    name: str
    device_id: str
    description: str = None


class DeviceResponse(BaseModel):
    id: int
    name: str
    device_id: str
    status: str
    last_seen: datetime = None
    created_at: datetime


@router.post("/", response_model=DeviceResponse)
async def register_device(
        device_data: DeviceCreate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    # Check if device exists
    existing = db.query(Device).filter(
        Device.device_id == device_data.device_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Device already registered")

    device = Device(
        name=device_data.name,
        device_id=device_data.device_id,
        description=device_data.description,
        user_id=current_user.id,
        status=DeviceStatus.ACTIVE,
        created_at=datetime.now()
    )

    db.add(device)
    db.commit()
    db.refresh(device)

    return DeviceResponse(
        id=device.id,
        name=device.name,
        device_id=device.device_id,
        status=device.status.value,
        last_seen=device.last_seen,
        created_at=device.created_at
    )


@router.get("/", response_model=List[DeviceResponse])
async def get_devices(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    devices = db.query(Device).filter(
        Device.user_id == current_user.id
    ).all()

    return [
        DeviceResponse(
            id=d.id,
            name=d.name,
            device_id=d.device_id,
            status=d.status.value,
            last_seen=d.last_seen,
            created_at=d.created_at
        )
        for d in devices
    ]


@router.delete("/{device_id}")
async def delete_device(
        device_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    device = db.query(Device).filter(
        Device.id == device_id,
        Device.user_id == current_user.id
    ).first()

    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    db.delete(device)
    db.commit()

    return {"message": "Device deleted"}


@router.patch("/{device_id}/status")
async def update_device_status(
        device_id: int,
        status: str,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    device = db.query(Device).filter(
        Device.id == device_id,
        Device.user_id == current_user.id
    ).first()

    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    try:
        device.status = DeviceStatus(status)
        db.commit()
        return {"message": "Status updated"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")