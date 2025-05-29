from typing import Dict, Set, Optional
from fastapi import WebSocket, WebSocketDisconnect, Query, HTTPException
from sqlalchemy.orm import Session
import json
import logging
from jose import JWTError, jwt
import os

from database import get_db
from models import User

logger = logging.getLogger(__name__)

# JWT Config (должно совпадать с auth.py)
SECRET_KEY = os.getenv("SECRET_KEY", "medical_secret_key_2024")
ALGORITHM = "HS256"


def verify_websocket_token(token: str) -> Optional[int]:
    """Проверка JWT токена для WebSocket подключения"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        token_type: str = payload.get("type")

        if user_id is None or token_type != "access":
            return None

        return int(user_id)
    except (JWTError, ValueError):
        return None


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_connections: Dict[int, Set[str]] = {}  # user_id -> connection_ids
        self.connection_users: Dict[str, int] = {}  # connection_id -> user_id

    async def connect(self, websocket: WebSocket, client_id: str, token: str = None):
        """Подключение WebSocket с JWT авторизацией"""

        # Проверяем токен если он предоставлен
        user_id = None
        if token:
            user_id = verify_websocket_token(token)
            if user_id is None:
                logger.warning(f"Invalid token for WebSocket connection: {client_id}")
                await websocket.close(code=4001, reason="Invalid token")
                return False

        await websocket.accept()
        self.active_connections[client_id] = websocket

        if user_id:
            # Связываем подключение с пользователем
            if user_id not in self.user_connections:
                self.user_connections[user_id] = set()
            self.user_connections[user_id].add(client_id)
            self.connection_users[client_id] = user_id

            logger.info(f"WebSocket connected for user {user_id}, connection {client_id}")
        else:
            logger.info(f"Anonymous WebSocket connection: {client_id}")

        return True

    def disconnect(self, client_id: str):
        """Отключение WebSocket"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]

            # Убираем связь с пользователем
            if client_id in self.connection_users:
                user_id = self.connection_users[client_id]
                if user_id in self.user_connections:
                    self.user_connections[user_id].discard(client_id)
                    if not self.user_connections[user_id]:
                        del self.user_connections[user_id]
                del self.connection_users[client_id]
                logger.info(f"WebSocket disconnected for user {user_id}, connection {client_id}")
            else:
                logger.info(f"Anonymous WebSocket disconnected: {client_id}")

    async def send_personal_message(self, message: str, client_id: str):
        """Отправка сообщения конкретному подключению"""
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_text(message)
            except Exception as e:
                logger.error(f"Failed to send message to {client_id}: {e}")
                self.disconnect(client_id)

    async def broadcast_to_user(self, user_id: int, message: dict):
        """Отправка данных всем подключениям пользователя"""
        if user_id in self.user_connections:
            message_text = json.dumps(message)
            disconnected_connections = []

            for connection_id in self.user_connections[user_id].copy():
                if connection_id in self.active_connections:
                    try:
                        await self.active_connections[connection_id].send_text(message_text)
                    except Exception as e:
                        logger.error(f"Failed to send to connection {connection_id}: {e}")
                        disconnected_connections.append(connection_id)
                else:
                    disconnected_connections.append(connection_id)

            # Очищаем неактивные подключения
            for connection_id in disconnected_connections:
                self.disconnect(connection_id)

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
            "level": alert_data.get("level", "INFO"),
            "timestamp": alert_data.get("timestamp")
        }
        await self.broadcast_to_user(user_id, message)

    async def broadcast_system_message(self, message: dict):
        """Отправка системного сообщения всем подключениям"""
        message_text = json.dumps(message)
        disconnected_connections = []

        for connection_id, websocket in self.active_connections.items():
            try:
                await websocket.send_text(message_text)
            except Exception as e:
                logger.error(f"Failed to broadcast to {connection_id}: {e}")
                disconnected_connections.append(connection_id)

        # Очищаем неактивные подключения
        for connection_id in disconnected_connections:
            self.disconnect(connection_id)

    def get_user_connections_count(self, user_id: int) -> int:
        """Получить количество активных подключений пользователя"""
        return len(self.user_connections.get(user_id, set()))

    def get_total_connections_count(self) -> int:
        """Получить общее количество активных подключений"""
        return len(self.active_connections)

    def get_authenticated_users_count(self) -> int:
        """Получить количество авторизованных пользователей онлайн"""
        return len(self.user_connections)

    async def disconnect_all(self):
        """Отключить все WebSocket соединения"""
        for client_id in list(self.active_connections.keys()):
            self.disconnect(client_id)

    def get_connection_info(self) -> dict:
        """Получить информацию о подключениях для отладки"""
        return {
            "total_connections": self.get_total_connections_count(),
            "authenticated_users": self.get_authenticated_users_count(),
            "user_connections": {
                user_id: len(connections)
                for user_id, connections in self.user_connections.items()
            }
        }


manager = ConnectionManager()


async def handle_websocket_message(websocket: WebSocket, client_id: str, data: str):
    """Обработка входящих WebSocket сообщений"""
    try:
        message = json.loads(data)
        message_type = message.get("type")

        if message_type == "ping":
            await websocket.send_text(json.dumps({"type": "pong", "timestamp": message.get("timestamp")}))

        elif message_type == "subscribe":
            # Подписка на определенные типы уведомлений
            topics = message.get("topics", [])
            logger.info(f"Client {client_id} subscribed to topics: {topics}")

        elif message_type == "get_status":
            # Запрос статуса подключения
            user_id = manager.connection_users.get(client_id)
            status = {
                "type": "status",
                "connection_id": client_id,
                "user_id": user_id,
                "authenticated": user_id is not None,
                "timestamp": message.get("timestamp")
            }
            await websocket.send_text(json.dumps(status))

        else:
            logger.warning(f"Unknown message type from {client_id}: {message_type}")

    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON from {client_id}: {e}")
    except Exception as e:
        logger.error(f"Error handling message from {client_id}: {e}")


# Функции для внешнего использования
async def notify_user_vital_update(user_id: int, vital_data: dict):
    """Уведомить пользователя об обновлении показателей"""
    await manager.broadcast_vital_update(user_id, vital_data)


async def notify_user_alert(user_id: int, alert_data: dict):
    """Уведомить пользователя о критических показателях"""
    await manager.broadcast_alert(user_id, alert_data)


async def notify_system_maintenance(message: str):
    """Уведомить всех пользователей о технических работах"""
    system_message = {
        "type": "system_maintenance",
        "message": message,
        "timestamp": json.dumps({"timestamp": "now"})  # Placeholder
    }
    await manager.broadcast_system_message(system_message)