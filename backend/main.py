from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from datetime import datetime
from typing import Optional

from api import auth, vitals, devices, analytics
from core.websocket import manager, handle_websocket_message
from services.redis_service import redis_service
from database import engine, Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Создание таблиц
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await redis_service.connect()
        logger.info("🚀 Medical Monitoring System Started")
        logger.info("📊 Database tables created/verified")
        logger.info("🔌 Redis connection established")
    except Exception as e:
        logger.error(f"Failed to start services: {e}")
        raise

    yield

    # Shutdown
    try:
        await redis_service.disconnect()
        await manager.disconnect_all()
        logger.info("👋 System Shutdown Complete")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


app = FastAPI(
    title="Medical IoT Monitoring",
    version="2.1.0",
    description="JWT-based Medical Monitoring System with WebSocket support",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Роуты API
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(vitals.router, prefix="/api/vitals", tags=["vitals"])
app.include_router(devices.router, prefix="/api/devices", tags=["devices"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])


@app.get("/")
async def root():
    return {
        "name": "Medical IoT Monitoring API",
        "version": "2.1.0",
        "status": "operational",
        "auth": "JWT",
        "features": ["Real-time monitoring", "WebSocket alerts", "Analytics"]
    }


@app.get("/api/health")
async def health_check():
    """Проверка состояния системы"""
    try:
        # Проверяем Redis
        redis_status = "connected" if redis_service else "disconnected"

        # Проверяем WebSocket connections
        ws_info = manager.get_connection_info()

        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "redis": redis_status,
                "database": "connected",
                "websocket": {
                    "status": "active",
                    **ws_info
                }
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }


@app.get("/api/status")
async def system_status():
    """Детальная информация о системе"""
    return {
        "system": "Medical IoT Monitoring",
        "version": "2.1.0",
        "uptime": "calculated_uptime",  # Здесь можно добавить реальный uptime
        "connections": manager.get_connection_info(),
        "timestamp": datetime.now().isoformat()
    }


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(
        websocket: WebSocket,
        client_id: str,
        token: Optional[str] = Query(None, description="JWT access token for authentication")
):
    """
    WebSocket endpoint с JWT авторизацией

    Параметры:
    - client_id: Уникальный ID подключения (может быть user_id или случайный)
    - token: JWT access token для авторизации (опционально)

    Поддерживаемые сообщения:
    - ping: Проверка соединения
    - subscribe: Подписка на уведомления
    - get_status: Получение статуса подключения
    """

    logger.info(f"WebSocket connection attempt: {client_id}, token={'present' if token else 'missing'}")

    # Пытаемся подключиться с проверкой токена
    connected = await manager.connect(websocket, client_id, token)

    if not connected:
        logger.warning(f"WebSocket connection rejected for {client_id}")
        return

    try:
        while True:
            data = await websocket.receive_text()
            logger.debug(f"WebSocket message from {client_id}: {data}")

            # Обрабатываем сообщение
            await handle_websocket_message(websocket, client_id, data)

    except WebSocketDisconnect:
        logger.info(f"WebSocket client {client_id} disconnected")
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error for {client_id}: {e}")
        manager.disconnect(client_id)


@app.post("/api/websocket/broadcast")
async def broadcast_message(message: dict):
    """
    Endpoint для отправки broadcast сообщений (для тестирования)
    Требует авторизации
    """
    try:
        await manager.broadcast_system_message(message)
        return {"status": "success", "message": "Broadcast sent"}
    except Exception as e:
        logger.error(f"Broadcast failed: {e}")
        return {"status": "error", "message": str(e)}


@app.get("/api/websocket/connections")
async def get_websocket_connections():
    """
    Получить информацию о WebSocket подключениях (для отладки)
    """
    return manager.get_connection_info()


# Обработчик ошибок
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}")
    return {
        "error": "Internal server error",
        "message": str(exc) if app.debug else "Something went wrong"
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8045,
        reload=True,
        log_level="info"
    )