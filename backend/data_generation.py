#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для заполнения медицинской базы данных тестовыми данными
Создает реалистичные данные для визуализации в Grafana
"""

import random
import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from faker import Faker
import hashlib
from database import DATABASE_URL
import os

# Импорт моделей (предполагается, что они в том же проекте)
from models import  *

# Настройка Faker для русских данных
fake = Faker('ru_RU')
Faker.seed(42)
random.seed(42)

# Подключение к БД
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class MedicalDataMocker:
    def __init__(self):
        self.session = SessionLocal()
        self.patients = []
        self.doctors = []
        self.devices = []

    def create_password_hash(self, password: str) -> str:
        """Простое хеширование пароля"""
        return hashlib.sha256(password.encode()).hexdigest()

    def create_doctors(self, count=10):
        """Создание врачей"""
        specialties = [
            "Кардиолог", "Терапевт", "Невролог", "Эндокринолог",
            "Гастроэнтеролог", "Пульмонолог", "Ревматолог", "Нефролог"
        ]

        print(f"Создание {count} врачей...")
        for i in range(count):
            doctor = Doctor(
                name=fake.name(),
                specialty=random.choice(specialties),
                phone=fake.phone_number(),
                email=fake.email()
            )
            self.session.add(doctor)
            self.doctors.append(doctor)

        self.session.commit()
        print(f"Создано {count} врачей")

    def create_patients(self, count=50):
        """Создание пациентов"""
        print(f"Создание {count} пациентов...")

        for i in range(count):
            # Создание пользователя
            user = User(
                username=f"patient_{i + 1}",
                email=fake.email(),
                password_hash=self.create_password_hash("password123"),
                role=UserRole.PATIENT,
                gdpr_consent_given=True,
                gdpr_consent_date=fake.date_time_between(start_date='-1y', end_date='now'),
                created_at=fake.date_time_between(start_date='-2y', end_date='now')
            )
            self.session.add(user)
            self.session.flush()  # Получаем ID

            # Создание профиля
            profile = UserProfile(
                user_id=user.id,
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                patronymic=fake.middle_name(),
                birth_date=fake.date_of_birth(minimum_age=18, maximum_age=85),
                gender=random.choice(['male', 'female']),
                phone_number=fake.phone_number(),
                address=fake.address(),
                emergency_contact=fake.phone_number(),
                blood_type=random.choice(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
                height=random.randint(150, 200),
                weight=random.randint(50, 120),
                allergies=random.choice([None, "Пенициллин", "Орехи", "Пыльца", "Молочные продукты"]),
                chronic_conditions=random.choice([None, "Гипертония", "Диабет 2 типа", "Астма"]),
                insurance_number=fake.random_number(digits=10),
                insurance_company=random.choice(["СОГАЗ", "ВТБ Страхование", "РЕСО", "АльфаСтрахование"])
            )
            self.session.add(profile)
            self.patients.append(user)

        self.session.commit()
        print(f"Создано {count} пациентов")

    def create_devices(self, count=100):
        """Создание IoT устройств"""
        device_types = [
            "Пульсоксиметр", "Тонометр", "Глюкометр", "Умные часы",
            "Датчик движения", "Термометр", "Весы", "ЭКГ монитор"
        ]

        print(f"Создание {count} устройств...")

        for i in range(count):
            patient = random.choice(self.patients)
            device = Device(
                name=random.choice(device_types),
                description=f"Устройство для мониторинга здоровья пациента",
                device_id=f"DEV_{i + 1:04d}_{fake.random_number(digits=6)}",
                user_id=patient.id,
                status=random.choice([DeviceStatus.ACTIVE, DeviceStatus.INACTIVE]),
                last_seen=fake.date_time_between(start_date='-30d', end_date='now'),
                created_at=fake.date_time_between(start_date='-1y', end_date='-30d')
            )
            self.session.add(device)
            self.devices.append(device)

        self.session.commit()
        print(f"Создано {count} устройств")

    def create_sensor_readings(self, days_back=30, readings_per_day=24):
        """Создание показаний датчиков для каждого устройства"""
        print(f"Создание показаний датчиков за {days_back} дней...")

        total_readings = 0
        for device in self.devices:
            if device.status == DeviceStatus.INACTIVE:
                continue

            # Генерируем показания за последние дни
            for day in range(days_back):
                date = datetime.datetime.now() - datetime.timedelta(days=day)

                # Количество показаний в день (с вариацией)
                daily_readings = random.randint(readings_per_day // 2, readings_per_day * 2)

                for reading_num in range(daily_readings):
                    # Распределяем показания равномерно по дню
                    timestamp = date.replace(
                        hour=random.randint(0, 23),
                        minute=random.randint(0, 59),
                        second=random.randint(0, 59)
                    )

                    reading = SensorReading(
                        device_id=device.id,
                        timestamp=timestamp,
                        temperature=round(random.uniform(18.0, 28.0), 1),
                        humidity=round(random.uniform(30.0, 80.0), 1),
                        pressure=round(random.uniform(750.0, 780.0), 1),
                        light=round(random.uniform(0.0, 1000.0), 1),
                        motion=random.randint(0, 100),
                        custom_value1=round(random.uniform(-10.0, 50.0), 2),
                        custom_value2=round(random.uniform(0.0, 100.0), 2)
                    )
                    self.session.add(reading)
                    total_readings += 1

        self.session.commit()
        print(f"Создано {total_readings} показаний датчиков")

    def create_heart_data(self, days_back=30):
        """Создание кардиологических данных"""
        print(f"Создание кардиологических данных за {days_back} дней...")

        total_records = 0
        for device in self.devices:
            if device.status == DeviceStatus.INACTIVE:
                continue

            # Не все устройства кардиологические
            if random.random() < 0.4:  # 40% устройств
                continue

            for day in range(days_back):
                date = datetime.datetime.now() - datetime.timedelta(days=day)

                # 2-8 измерений в день
                daily_readings = random.randint(2, 8)

                for _ in range(daily_readings):
                    timestamp = date.replace(
                        hour=random.randint(0, 23),
                        minute=random.randint(0, 59),
                        second=random.randint(0, 59)
                    )

                    # Генерируем реалистичные показатели
                    base_hr = random.randint(60, 100)  # Базовый пульс
                    activity = random.randint(0, 10)  # Уровень активности
                    hr_variation = activity * 10  # Увеличение пульса от активности

                    heart_data = HeartData(
                        device_id=device.id,
                        timestamp=timestamp,
                        heart_rate=base_hr + hr_variation + random.randint(-10, 10),
                        spo2=round(random.uniform(95.0, 100.0), 1),
                        hrv=round(random.uniform(20.0, 50.0), 1),
                        blood_pressure_systolic=random.randint(110, 140),
                        blood_pressure_diastolic=random.randint(70, 90),
                        temperature=round(random.uniform(36.0, 37.5), 1),
                        activity_level=activity
                    )
                    self.session.add(heart_data)
                    total_records += 1

        self.session.commit()
        print(f"Создано {total_records} кардиологических записей")

    def create_diagnoses(self):
        """Создание диагнозов"""
        diagnoses_list = [
            "Артериальная гипертензия", "Сахарный диабет 2 типа", "ИБС",
            "Бронхиальная астма", "Гастрит", "Остеоартроз", "Мигрень",
            "Депрессивный эпизод", "Гипотиреоз", "Анемия"
        ]

        print("Создание диагнозов...")
        diagnoses_count = 0

        for patient in self.patients:
            # У каждого пациента может быть 0-3 диагноза
            num_diagnoses = random.choices([0, 1, 2, 3], weights=[30, 40, 20, 10])[0]

            for _ in range(num_diagnoses):
                diagnosis = Diagnosis(
                    patient_id=patient.id,
                    doctor_id=random.choice(self.doctors).id,
                    date=fake.date_time_between(start_date='-2y', end_date='now'),
                    title=random.choice(diagnoses_list),
                    status=random.choice(["active", "resolved", "chronic"])
                )
                self.session.add(diagnosis)
                diagnoses_count += 1

        self.session.commit()
        print(f"Создано {diagnoses_count} диагнозов")

    def create_lab_tests(self):
        """Создание лабораторных анализов"""
        print("Создание лабораторных анализов...")

        labs = ["Инвитро", "Гемотест", "KDL", "Медси лаб", "СМ-Клиника лаб"]
        tests_count = 0

        for patient in self.patients:
            # Количество анализов на пациента
            num_tests = random.randint(1, 5)

            for _ in range(num_tests):
                test_date = fake.date_time_between(start_date='-1y', end_date='now')

                lab_test = LabTest(
                    patient_id=patient.id,
                    test_date=test_date,
                    lab_name=random.choice(labs),
                    reference_number=f"REF_{fake.random_number(digits=8)}",
                    doctor_id=random.choice(self.doctors).id if random.random() < 0.8 else None,
                    notes=fake.text(max_nb_chars=200) if random.random() < 0.3 else None
                )
                self.session.add(lab_test)
                self.session.flush()

                # Создаем различные типы анализов
                self.create_random_test_results(lab_test)
                tests_count += 1

        self.session.commit()
        print(f"Создано {tests_count} лабораторных анализов")

    def create_random_test_results(self, lab_test):
        """Создание результатов различных анализов"""
        test_types = ['blood_count', 'biochemistry', 'lipid_panel', 'thyroid_panel', 'urinalysis']
        selected_types = random.sample(test_types, random.randint(1, 3))

        for test_type in selected_types:
            if test_type == 'blood_count':
                blood_count = BloodCount(
                    lab_test_id=lab_test.id,
                    hemoglobin=round(random.uniform(110, 160), 1),
                    erythrocytes=round(random.uniform(3.8, 5.5), 2),
                    hematocrit=round(random.uniform(35, 50), 1),
                    leukocytes=round(random.uniform(4.0, 9.0), 1),
                    platelets=round(random.uniform(150, 400), 0),
                    esr=random.randint(2, 20),
                    neutrophils_percent=round(random.uniform(45, 70), 1),
                    lymphocytes_percent=round(random.uniform(20, 40), 1),
                    monocytes_percent=round(random.uniform(2, 10), 1),
                    eosinophils_percent=round(random.uniform(1, 5), 1),
                    basophils_percent=round(random.uniform(0, 2), 1)
                )
                self.session.add(blood_count)

            elif test_type == 'biochemistry':
                biochemistry = Biochemistry(
                    lab_test_id=lab_test.id,
                    glucose=round(random.uniform(3.9, 6.1), 1),
                    creatinine=round(random.uniform(60, 120), 0),
                    urea=round(random.uniform(2.5, 8.3), 1),
                    alt=round(random.uniform(7, 56), 0),
                    ast=round(random.uniform(10, 40), 0),
                    total_bilirubin=round(random.uniform(5, 21), 1),
                    total_protein=round(random.uniform(64, 83), 1),
                    albumin=round(random.uniform(35, 50), 1),
                    sodium=round(random.uniform(136, 145), 1),
                    potassium=round(random.uniform(3.5, 5.1), 1),
                    calcium=round(random.uniform(2.15, 2.55), 2),
                    crp=round(random.uniform(0, 5), 1)
                )
                self.session.add(biochemistry)

            elif test_type == 'lipid_panel':
                lipid = LipidPanel(
                    lab_test_id=lab_test.id,
                    total_cholesterol=round(random.uniform(3.0, 7.0), 1),
                    hdl_cholesterol=round(random.uniform(1.0, 2.5), 1),
                    ldl_cholesterol=round(random.uniform(1.5, 5.0), 1),
                    triglycerides=round(random.uniform(0.5, 3.0), 1),
                    cholesterol_hdl_ratio=round(random.uniform(2.0, 6.0), 1)
                )
                self.session.add(lipid)

    def create_visits(self):
        """Создание визитов к врачам"""
        print("Создание визитов к врачам...")

        reasons = [
            "Плановый осмотр", "Жалобы на боли в груди", "Контроль артериального давления",
            "Головные боли", "Профилактический осмотр", "Контроль сахара крови",
            "Боли в спине", "Простудные симптомы", "Консультация по результатам анализов"
        ]

        visits_count = 0
        for patient in self.patients:
            num_visits = random.randint(1, 8)

            for _ in range(num_visits):
                visit = Visit(
                    patient_id=patient.id,
                    doctor_id=random.choice(self.doctors).id,
                    date=fake.date_time_between(start_date='-1y', end_date='now'),
                    reason=random.choice(reasons),
                    notes=fake.text(max_nb_chars=500) if random.random() < 0.7 else None
                )
                self.session.add(visit)
                visits_count += 1

        self.session.commit()
        print(f"Создано {visits_count} визитов")

    def run_full_mock(self):
        """Запуск полного процесса заполнения данными"""
        print("=== Начало заполнения базы данных тестовыми данными ===")

        try:
            # Создание основных сущностей
            self.create_doctors(count=15)
            self.create_patients(count=100)
            self.create_devices(count=200)

            # Создание временных данных
            self.create_sensor_readings(days_back=60, readings_per_day=24)
            self.create_heart_data(days_back=60)

            # Создание медицинских данных
            self.create_diagnoses()
            self.create_lab_tests()
            self.create_visits()

            print("\n=== Заполнение завершено успешно! ===")
            print("\nСтатистика созданных данных:")
            print(f"- Врачи: {len(self.doctors)}")
            print(f"- Пациенты: {len(self.patients)}")
            print(f"- Устройства: {len(self.devices)}")

            # Статистика по записям
            sensor_count = self.session.query(SensorReading).count()
            heart_count = self.session.query(HeartData).count()
            diagnosis_count = self.session.query(Diagnosis).count()
            lab_count = self.session.query(LabTest).count()
            visit_count = self.session.query(Visit).count()

            print(f"- Показания датчиков: {sensor_count}")
            print(f"- Кардиологические данные: {heart_count}")
            print(f"- Диагнозы: {diagnosis_count}")
            print(f"- Лабораторные анализы: {lab_count}")
            print(f"- Визиты к врачам: {visit_count}")

        except Exception as e:
            print(f"Ошибка при заполнении данными: {e}")
            self.session.rollback()
            raise
        finally:
            self.session.close()


def create_grafana_queries():
    """Создание полезных SQL запросов для Grafana"""
    queries = {
        "Средний пульс по дням": """
        SELECT 
            DATE(timestamp) as time,
            AVG(heart_rate) as avg_heart_rate
        FROM heart_data 
        WHERE timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(timestamp)
        ORDER BY time;
        """,

        "Активность устройств": """
        SELECT 
            DATE(timestamp) as time,
            COUNT(DISTINCT device_id) as active_devices
        FROM sensor_readings 
        WHERE timestamp >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(timestamp)
        ORDER BY time;
        """,

        "Показания температуры по часам": """
        SELECT 
            DATE_TRUNC('hour', timestamp) as time,
            AVG(temperature) as avg_temp,
            MIN(temperature) as min_temp,
            MAX(temperature) as max_temp
        FROM sensor_readings 
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
        GROUP BY DATE_TRUNC('hour', timestamp)
        ORDER BY time;
        """,

        "Количество новых диагнозов по месяцам": """
        SELECT 
            DATE_TRUNC('month', date) as time,
            COUNT(*) as diagnoses_count
        FROM diagnoses 
        WHERE date >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', date)
        ORDER BY time;
        """,

        "Топ диагнозов": """
        SELECT 
            title,
            COUNT(*) as count
        FROM diagnoses 
        GROUP BY title
        ORDER BY count DESC
        LIMIT 10;
        """
    }

    print("\n=== Полезные запросы для Grafana ===")
    for title, query in queries.items():
        print(f"\n-- {title}")
        print(query)


if __name__ == "__main__":

    # Создание и запуск мокера
    mocker = MedicalDataMocker()
    mocker.run_full_mock()

    # Вывод полезных запросов
    create_grafana_queries()

    print("\n🎉 База данных готова для подключения к Grafana!")
    print("💡 Используйте SQL запросы выше для создания дашбордов")