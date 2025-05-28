import os
from typing import Optional


class Settings:
    # Database
    DB_USER: str = os.getenv("DB_USER", "medical_user")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "medical_password")
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "5432")
    DB_NAME: str = os.getenv("DB_NAME", "medical_db")

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "medical_secret_key_2024")
    SALT: str = os.getenv("SALT", "default_salt_change_in_production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Telegram
    TELEGRAM_BOT_TOKEN: Optional[str] = os.getenv("TELEGRAM_BOT_TOKEN")
    TELEGRAM_CHAT_ID: Optional[str] = os.getenv("TELEGRAM_CHAT_ID")

    # Thresholds
    VITAL_THRESHOLDS = {
        "heart_rate": {
            "critical_low": 40,
            "low": 50,
            "high": 100,
            "critical_high": 120
        },
        "spo2": {
            "critical_low": 90,
            "low": 95,
            "normal_min": 95,
            "normal_max": 100
        },
        "temperature": {
            "low": 36.0,
            "normal_min": 36.1,
            "normal_max": 37.2,
            "high": 37.5,
            "critical_high": 39.0
        },
        "blood_pressure_systolic": {
            "low": 90,
            "normal_min": 90,
            "normal_max": 140,
            "high": 140,
            "critical_high": 180
        },
        "blood_pressure_diastolic": {
            "low": 60,
            "normal_min": 60,
            "normal_max": 90,
            "high": 90,
            "critical_high": 110
        }
    }

    # Application
    APP_NAME: str = "Medical IoT Monitoring"
    APP_VERSION: str = "2.0.0"
    CORS_ORIGINS: list = ["*"]

    # IoT
    IOT_DATA_RETENTION_DAYS: int = 7
    IOT_AGGREGATION_INTERVAL_MINUTES: int = 15

    # Monitoring
    METRICS_CACHE_TTL: int = 300  # 5 minutes
    DASHBOARD_CACHE_TTL: int = 60  # 1 minute


settings = Settings()