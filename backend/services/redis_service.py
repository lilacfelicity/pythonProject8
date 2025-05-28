import json
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import logging

try:
    import redis.asyncio as aioredis

    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)


class RedisService:
    def __init__(self):
        self.client = None
        self.pubsub = None
        self.connected = False
        self.memory_cache = {}

    async def connect(self, redis_url: str = "redis://redis:6379"):
        if not REDIS_AVAILABLE:
            logger.warning("Redis not available - using memory")
            return

        try:
            self.client = aioredis.from_url(redis_url, decode_responses=True)
            await self.client.ping()
            self.pubsub = self.client.pubsub()
            self.connected = True
            logger.info("✅ Redis connected")
        except Exception as e:
            logger.error(f"❌ Redis error: {e}")

    async def disconnect(self):
        if self.pubsub:
            await self.pubsub.close()
        if self.client:
            await self.client.close()

    async def store_vital(self, device_id: str, user_id: int, vital_type: str, value: float):
        """Store vital sign with timestamp"""
        timestamp = datetime.now().isoformat()
        key = f"vitals:{user_id}:{vital_type}"

        data = {
            "device_id": device_id,
            "value": value,
            "timestamp": timestamp
        }

        if self.connected:
            # Store in sorted set
            await self.client.zadd(key, {json.dumps(data): datetime.now().timestamp()})
            # Keep only last 24 hours
            cutoff = (datetime.now() - timedelta(hours=24)).timestamp()
            await self.client.zremrangebyscore(key, 0, cutoff)
            # Publish update
            await self.publish_vital_update(user_id, vital_type, data)
        else:
            # Memory fallback
            if key not in self.memory_cache:
                self.memory_cache[key] = []
            self.memory_cache[key].append(data)
            # Keep only last 100 items
            self.memory_cache[key] = self.memory_cache[key][-100:]

    async def get_vitals(self, user_id: int, vital_type: str, hours: int = 24) -> List[Dict]:
        """Get vitals for last N hours"""
        key = f"vitals:{user_id}:{vital_type}"
        cutoff = (datetime.now() - timedelta(hours=hours)).timestamp()

        if self.connected:
            results = await self.client.zrangebyscore(key, cutoff, "+inf")
            return [json.loads(r) for r in results]
        else:
            if key in self.memory_cache:
                cutoff_dt = datetime.now() - timedelta(hours=hours)
                return [
                    d for d in self.memory_cache[key]
                    if datetime.fromisoformat(d["timestamp"]) > cutoff_dt
                ]
            return []

    async def get_latest_vitals(self, user_id: int) -> Dict[str, Any]:
        """Get latest vital signs for all types"""
        vital_types = ["heart_rate", "blood_pressure", "spo2", "temperature"]
        latest = {}

        for vtype in vital_types:
            vitals = await self.get_vitals(user_id, vtype, hours=1)
            if vitals:
                latest[vtype] = vitals[-1]

        return latest

    async def cache_set(self, key: str, value: Any, expire_seconds: int = 3600):
        """Set cache value"""
        if self.connected:
            await self.client.setex(key, expire_seconds, json.dumps(value, default=str))
        else:
            self.memory_cache[key] = {
                'value': value,
                'expires': datetime.now() + timedelta(seconds=expire_seconds)
            }

    async def cache_get(self, key: str) -> Optional[Any]:
        """Get cache value"""
        if self.connected:
            value = await self.client.get(key)
            return json.loads(value) if value else None
        else:
            if key in self.memory_cache:
                entry = self.memory_cache[key]
                if datetime.now() < entry['expires']:
                    return entry['value']
                del self.memory_cache[key]
            return None

    async def publish_vital_update(self, user_id: int, vital_type: str, data: dict):
        """Publish vital update to channel"""
        if self.connected:
            channel = f"vitals:{user_id}"
            message = {
                "type": vital_type,
                "data": data
            }
            await self.client.publish(channel, json.dumps(message))

    async def subscribe_to_vitals(self, user_id: int):
        """Subscribe to vital updates for user"""
        if self.connected and self.pubsub:
            channel = f"vitals:{user_id}"
            await self.pubsub.subscribe(channel)
            return self.pubsub
        return None

    async def store_alert(self, user_id: int, alert: dict):
        """Store alert in list"""
        key = f"alerts:{user_id}"
        if self.connected:
            await self.client.lpush(key, json.dumps(alert))
            await self.client.ltrim(key, 0, 99)  # Keep last 100
            await self.client.expire(key, 86400)  # 24h
        else:
            if key not in self.memory_cache:
                self.memory_cache[key] = []
            self.memory_cache[key].insert(0, alert)
            self.memory_cache[key] = self.memory_cache[key][:100]

    async def get_alerts(self, user_id: int, limit: int = 10) -> List[dict]:
        """Get recent alerts"""
        key = f"alerts:{user_id}"
        if self.connected:
            results = await self.client.lrange(key, 0, limit - 1)
            return [json.loads(r) for r in results]
        else:
            return self.memory_cache.get(key, [])[:limit]


redis_service = RedisService()