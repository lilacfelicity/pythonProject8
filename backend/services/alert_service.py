import aiohttp
import logging
from datetime import datetime
from typing import Dict, Optional
import os

from services.redis_service import redis_service

logger = logging.getLogger(__name__)


class AlertService:
    def __init__(self):
        self.telegram_token = os.getenv("TELEGRAM_BOT_TOKEN", "")
        self.telegram_chat_id = os.getenv("TELEGRAM_CHAT_ID", "")

    async def send_alert(self, user_id: int, alert_data: dict):
        """Send alert through multiple channels"""
        # Store in Redis
        await redis_service.store_alert(user_id, alert_data)

        # Send to Telegram if configured
        if self.telegram_token and self.telegram_chat_id:
            await self._send_telegram_alert(user_id, alert_data)

        # Log alert
        logger.warning(f"Alert for user {user_id}: {alert_data}")

    async def _send_telegram_alert(self, user_id: int, alert_data: dict):
        """Send Telegram notification"""
        try:
            level = alert_data.get("type", "info")
            emoji = {"critical": "🚨", "warning": "⚠️", "info": "ℹ️"}.get(level, "📢")

            message = f"""
{emoji} Medical Alert

Patient ID: {user_id}
Level: {level.upper()}
Metric: {alert_data.get('metric', 'Unknown')}
Value: {alert_data.get('value', 'N/A')}
Message: {alert_data.get('message', 'No message')}
Time: {alert_data.get('timestamp', datetime.now().isoformat())}
""".strip()

            url = f"https://api.telegram.org/bot{self.telegram_token}/sendMessage"
            payload = {
                "chat_id": self.telegram_chat_id,
                "text": message,
                "parse_mode": "Markdown"
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as response:
                    if response.status == 200:
                        logger.info(f"Telegram alert sent for user {user_id}")
                    else:
                        logger.error(f"Failed to send Telegram alert: {response.status}")

        except Exception as e:
            logger.error(f"Telegram error: {e}")

    async def check_thresholds(self, user_id: int, vital_type: str, value: float) -> Optional[dict]:
        """Check if value exceeds thresholds"""
        thresholds = {
            "heart_rate": {"low": 50, "high": 100, "critical_high": 120},
            "spo2": {"critical_low": 90, "low": 95},
            "temperature": {"high": 37.5, "critical_high": 39.0},
            "blood_pressure": {"high": 140, "critical_high": 180}
        }

        if vital_type not in thresholds:
            return None

        limits = thresholds[vital_type]
        alert = None

        if "critical_high" in limits and value >= limits["critical_high"]:
            alert = {
                "type": "critical",
                "metric": vital_type,
                "value": value,
                "threshold": limits["critical_high"],
                "direction": "high"
            }
        elif "critical_low" in limits and value <= limits["critical_low"]:
            alert = {
                "type": "critical",
                "metric": vital_type,
                "value": value,
                "threshold": limits["critical_low"],
                "direction": "low"
            }
        elif "high" in limits and value >= limits["high"]:
            alert = {
                "type": "warning",
                "metric": vital_type,
                "value": value,
                "threshold": limits["high"],
                "direction": "high"
            }
        elif "low" in limits and value <= limits["low"]:
            alert = {
                "type": "warning",
                "metric": vital_type,
                "value": value,
                "threshold": limits["low"],
                "direction": "low"
            }

        return alert


alert_service = AlertService()