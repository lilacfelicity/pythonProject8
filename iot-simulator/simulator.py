import asyncio
import aiohttp
import random
import json
import logging
from datetime import datetime
import math

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class IoTDeviceSimulator:
    def __init__(self, device_id: str, api_url: str):
        self.device_id = device_id
        self.api_url = api_url
        self.running = False
        self.base_hr = 75
        self.base_temp = 36.6
        self.base_spo2 = 98
        self.base_bp_sys = 120
        self.base_bp_dia = 80
        self.activity_level = 0
        self.stress_level = 0

    def generate_vitals(self):
        """Generate realistic vital signs with variations"""
        # Time-based variations
        time_factor = math.sin(datetime.now().timestamp() / 3600) * 0.1

        # Activity simulation
        if random.random() < 0.1:  # 10% chance of activity change
            self.activity_level = random.uniform(0, 1)

        # Stress simulation
        if random.random() < 0.05:  # 5% chance of stress event
            self.stress_level = random.uniform(0, 1)
        else:
            self.stress_level *= 0.95  # Gradual decrease

        # Calculate vitals
        hr = self.base_hr + (self.activity_level * 40) + (self.stress_level * 20) + random.gauss(0, 3) + time_factor * 5

        temp = self.base_temp + (self.activity_level * 0.5) + random.gauss(0, 0.1)

        spo2 = self.base_spo2 - (self.activity_level * 2) + random.gauss(0, 0.5)
        spo2 = max(94, min(100, spo2))  # Clamp to realistic range

        bp_sys = self.base_bp_sys + (self.activity_level * 20) + (self.stress_level * 15) + random.gauss(0, 5)
        bp_dia = self.base_bp_dia + (self.activity_level * 10) + (self.stress_level * 8) + random.gauss(0, 3)

        # Occasional anomalies
        if random.random() < 0.02:  # 2% chance
            anomaly_type = random.choice(["hr", "bp", "spo2", "temp"])
            if anomaly_type == "hr":
                hr = random.choice([45, 140])  # Bradycardia or tachycardia
            elif anomaly_type == "bp":
                bp_sys = random.choice([90, 160])  # Hypotension or hypertension
            elif anomaly_type == "spo2":
                spo2 = random.uniform(88, 93)  # Low oxygen
            elif anomaly_type == "temp":
                temp = random.uniform(37.8, 39.0)  # Fever

        return {
            "heart_rate": int(hr),
            "temperature": round(temp, 1),
            "spo2": round(spo2, 1),
            "blood_pressure_systolic": int(bp_sys),
            "blood_pressure_diastolic": int(bp_dia),
            "activity_level": round(self.activity_level, 2),
            "timestamp": datetime.now().isoformat()
        }

    async def send_data(self, session: aiohttp.ClientSession):
        """Send data to API"""
        vitals = self.generate_vitals()

        # Format for IoT endpoint
        payload = {
            "device_id": self.device_id,
            "data": vitals
        }

        try:
            async with session.post(
                    f"{self.api_url}/api/vitals/iot",
                    json=payload
            ) as response:
                if response.status == 200:
                    logger.info(
                        f"✅ Device {self.device_id}: Sent vitals - HR: {vitals['heart_rate']}, SpO2: {vitals['spo2']}")
                else:
                    logger.error(f"❌ Device {self.device_id}: Failed to send data - {response.status}")
        except Exception as e:
            logger.error(f"❌ Device {self.device_id}: Connection error - {e}")

    async def run(self, interval: int = 10):
        """Run the simulator"""
        self.running = True
        logger.info(f"🚀 Device {self.device_id} started - sending data every {interval}s")

        async with aiohttp.ClientSession() as session:
            while self.running:
                await self.send_data(session)
                await asyncio.sleep(interval)

    def stop(self):
        """Stop the simulator"""
        self.running = False
        logger.info(f"🛑 Device {self.device_id} stopped")


class MultiDeviceSimulator:
    def __init__(self, api_url: str):
        self.api_url = api_url
        self.devices = []

    def add_device(self, device_id: str):
        """Add a device to simulate"""
        device = IoTDeviceSimulator(device_id, self.api_url)
        self.devices.append(device)
        return device

    async def run_all(self, interval: int = 10):
        """Run all device simulators"""
        tasks = []
        for device in self.devices:
            task = asyncio.create_task(device.run(interval))
            tasks.append(task)

        await asyncio.gather(*tasks)


async def main():
    # Configuration
    API_URL = "http://backend:8045"  # Docker network
    # API_URL = "http://localhost:8045"  # Local testing

    # Create simulator
    simulator = MultiDeviceSimulator(API_URL)

    # Add devices
    devices = [
        "PULSE_001",
        "BP_001",
        "MULTI_001"
    ]

    for device_id in devices:
        simulator.add_device(device_id)

    logger.info(f"🏥 Medical IoT Simulator Started - {len(devices)} devices")
    logger.info(f"📡 Sending to: {API_URL}")

    try:
        # Run with different intervals for variety
        await simulator.run_all(interval=10)
    except KeyboardInterrupt:
        logger.info("⏹️  Simulator stopped by user")


if __name__ == "__main__":
    asyncio.run(main())