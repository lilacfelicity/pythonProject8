from typing import Dict, Set
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_devices: Dict[int, Set[str]] = {}  # user_id -> device_ids

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Client {client_id} connected")

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(f"Client {client_id} disconnected")

    async def send_personal_message(self, message: str, client_id: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_text(message)

    async def broadcast_to_user(self, user_id: int, message: dict):
        """Отправка данных всем устройствам пользователя"""
        if user_id in self.user_devices:
            message_text = json.dumps(message)
            for device_id in self.user_devices[user_id]:
                if device_id in self.active_connections:
                    try:
                        await self.active_connections[device_id].send_text(message_text)
                    except:
                        self.disconnect(device_id)

    async def broadcast_vital_update(self, user_id: int, vital_data: dict):
        """Broadcast vital signs update"""
        message = {
            "type": "vital_update",
            "data": vital_data,
            "timestamp": vital_data.get("timestamp")
        }
        await self.broadcast_to_user(user_id, message)

    async def broadcast_alert(self, user_id: int, alert_data: dict):
        """Broadcast alert to user devices"""
        message = {
            "type": "alert",
            "data": alert_data,
            "level": alert_data.get("level", "INFO")
        }
        await self.broadcast_to_user(user_id, message)

    def register_user_device(self, user_id: int, device_id: str):
        if user_id not in self.user_devices:
            self.user_devices[user_id] = set()
        self.user_devices[user_id].add(device_id)

    async def disconnect_all(self):
        for client_id in list(self.active_connections.keys()):
            self.disconnect(client_id)


manager = ConnectionManager()