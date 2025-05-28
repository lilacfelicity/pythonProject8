from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from datetime import datetime

from api import auth, vitals, devices, analytics
from core.websocket import manager
from services.redis_service import redis_service
from database import engine, Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Создание таблиц
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await redis_service.connect()
    logger.info("🚀 Medical Monitoring System Started")
    yield
    # Shutdown
    await redis_service.disconnect()
    await manager.disconnect_all()
    logger.info("👋 System Shutdown")

app = FastAPI(
    title="Medical IoT Monitoring",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Роуты
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(vitals.router, prefix="/api/vitals", tags=["vitals"])
app.include_router(devices.router, prefix="/api/devices", tags=["devices"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])

@app.get("/")
async def root():
    return {
        "name": "Medical IoT Monitoring API",
        "version": "2.0.0",
        "status": "operational"
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Обработка команд от клиента
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(client_id)