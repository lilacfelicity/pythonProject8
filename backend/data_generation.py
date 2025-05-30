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
from core.config import settings
import os

# Импорт моделей
from models import *

# Настройка Faker для русских данных
fake = Faker('ru_RU')
Faker.seed(42)
random.seed(42)

# Подключение к БД
from core.config import settings

# Create engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class MedicalDataMocker:
    def __init__(self):
        self.session = SessionLocal()
        self.patients = []
        self.doctors = []
        self.devices = []
        self.family_members = []

    def clear_all_data(self):
        """Очистка всех таблиц перед заполнением"""
        print("Очистка существующих данных...")

        # Список таблиц в правильном порядке (зависимые сначала)
        tables_to_clear = [
            'med_sensor_readings', 'med_heart_datas', 'med_blood_counts',
            'med_biochemistries', 'med_lipid_panels', 'med_thyroid_panels',
            'med_lab_tests', 'med_medical_tests', 'med_visits', 'med_medications',
            'med_diagnoses', 'med_patient_doctors', 'med_family_accesses',
            'med_devices', 'med_user_profiles', 'med_users', 'med_doctors'
        ]

        for table in tables_to_clear:
            try:
                # Каждая таблица в отдельной транзакции
                self.session.execute(text(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE"))
                self.session.commit()
            except Exception as e:
                # Rollback после каждой ошибки
                self.session.rollback()
                print(f"Предупреждение: не удалось очистить таблицу {table}: {e}")
                continue

        print("Очистка данных завершена")

    def create_password_hash(self, password: str) -> str:
        """Хеширование пароля с использованием PBKDF2 (аналогично generate_password_hash.py)"""
        salt = "your-salt-here"
        return hashlib.pbkdf2_hmac('sha256', (password + salt).encode(), salt.encode(), 100000).hex()

    def create_doctors(self, count=10):
        """Создание врачей"""
        specialties = [
            "Кардиолог", "Терапевт", "Невролог", "Эндокринолог",
            "Гастроэнтеролог", "Пульмонолог", "Ревматолог", "Нефролог",
            "Онколог", "Гематолог", "Уролог", "Офтальмолог"
        ]

        print(f"Создание {count} врачей...")
        for i in range(count):
            doctor = Doctor(
                name=fake.name(),
                specialty=random.choice(specialties),
                phone=fake.phone_number(),
                email=f"doctor_{i}_{fake.email()}"  # Делаем email уникальным
            )
            self.session.add(doctor)
            self.doctors.append(doctor)

        self.session.commit()
        print(f"Создано {count} врачей")

    def create_patients(self, count=50):
        """Создание пациентов"""
        print(f"Создание {count} пациентов...")

        for i in range(count):
            # Создание пользователя - используем только существующие поля
            user = User(
                username=f"patient_{i + 1}",
                email=f"patient_{i}_{fake.email()}",  # Делаем email уникальным
                password_hash=self.create_password_hash("password123"),
                role=UserRole.PATIENT,
                is_active=True,
                created_at=fake.date_time_between(start_date='-2y', end_date='now'),
                last_login=fake.date_time_between(start_date='-30d', end_date='now') if random.random() < 0.8 else None,
                failed_login_attempts=random.randint(0, 3),
                last_password_change=fake.date_time_between(start_date='-1y', end_date='now')
            )
            self.session.add(user)
            self.session.flush()

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
                allergies=random.choice([None, "Пенициллин", "Орехи", "Пыльца", "Молочные продукты", "Аспирин"]),
                chronic_conditions=random.choice([None, "Гипертония", "Диабет 2 типа", "Астма", "Артрит"]),
                insurance_number=str(fake.random_number(digits=10)),
                insurance_company=random.choice(["СОГАЗ", "ВТБ Страхование", "РЕСО", "АльфаСтрахование"])
            )
            self.session.add(profile)
            self.patients.append(user)

        self.session.commit()
        print(f"Создано {count} пациентов")

    def create_family_members(self, count=20):
        """Создание членов семьи"""
        print(f"Создание {count} членов семьи...")

        for i in range(count):
            user = User(
                username=f"family_{i + 1}",
                email=f"family_{i}_{fake.email()}",  # Делаем email уникальным
                password_hash=self.create_password_hash("password123"),
                role=UserRole.FAMILY_MEMBER,
                is_active=True,
                created_at=fake.date_time_between(start_date='-2y', end_date='now'),
                last_login=fake.date_time_between(start_date='-30d', end_date='now') if random.random() < 0.7 else None,
                failed_login_attempts=random.randint(0, 2),
                last_password_change=fake.date_time_between(start_date='-1y', end_date='now')
            )
            self.session.add(user)
            self.session.flush()

            # Создание профиля
            profile = UserProfile(
                user_id=user.id,
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                patronymic=fake.middle_name(),
                birth_date=fake.date_of_birth(minimum_age=20, maximum_age=60),
                gender=random.choice(['male', 'female']),
                phone_number=fake.phone_number(),
                address=fake.address(),
                emergency_contact=fake.phone_number()
            )
            self.session.add(profile)
            self.family_members.append(user)

        self.session.commit()
        print(f"Создано {count} членов семьи")

    def create_patient_doctor_relationships(self):
        """Создание связей пациент-врач"""
        print("Создание связей пациент-врач...")
        relationships_count = 0

        for patient in self.patients:
            # У каждого пациента 1-3 врача
            num_doctors = random.randint(1, 3)
            assigned_doctors = random.sample(self.doctors, num_doctors)

            for idx, doctor in enumerate(assigned_doctors):
                patient_doctor = PatientDoctor(
                    patient_id=patient.id,
                    doctor_id=doctor.id,
                    is_primary=(idx == 0),  # Первый врач - основной
                    assigned_date=fake.date_time_between(start_date='-2y', end_date='now')
                )
                self.session.add(patient_doctor)
                relationships_count += 1

        self.session.commit()
        print(f"Создано {relationships_count} связей пациент-врач")

    def create_family_access(self):
        """Создание семейного доступа"""
        print("Создание семейного доступа...")
        access_count = 0

        # Назначаем членов семьи случайным пациентам
        for family_member in self.family_members:
            # Каждый член семьи связан с 1-2 пациентами
            num_patients = random.randint(1, 2)
            linked_patients = random.sample(self.patients, num_patients)

            for patient in linked_patients:
                relationship_types = ["Супруг(а)", "Сын/Дочь", "Родитель", "Брат/Сестра"]

                family_access = FamilyAccess(
                    patient_id=patient.id,
                    family_member_id=family_member.id,
                    relationship_type=random.choice(relationship_types),
                    is_active=random.choice([True, True, True, False]),  # 75% активных
                    date_granted=fake.date_time_between(start_date='-1y', end_date='now'),
                    expiry_date=fake.date_time_between(start_date='now',
                                                       end_date='+1y') if random.random() < 0.3 else None,
                    can_view_diagnoses=random.choice([True, True, False]),
                    can_view_medications=True,
                    can_view_lab_tests=True,
                    can_view_visits=random.choice([True, True, False]),
                    can_view_vitals=True,
                    can_view_devices=True,
                    receive_critical_alerts=True,
                    notes=fake.text(max_nb_chars=100) if random.random() < 0.2 else None
                )
                self.session.add(family_access)
                access_count += 1

        self.session.commit()
        print(f"Создано {access_count} записей семейного доступа")

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
            "Депрессивный эпизод", "Гипотиреоз", "Анемия", "ОРВИ",
            "Пневмония", "Цистит", "Дерматит", "Аллергический ринит"
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

    def create_medications(self):
        """Создание лекарственных назначений"""
        medications_list = [
            ("Лозартан", "50 мг", "1 раз в день"),
            ("Метформин", "850 мг", "2 раза в день"),
            ("Аторвастатин", "20 мг", "1 раз в день на ночь"),
            ("Омепразол", "20 мг", "1 раз в день утром"),
            ("Парацетамол", "500 мг", "при необходимости, не более 4 раз в день"),
            ("Амоксициллин", "500 мг", "3 раза в день"),
            ("Эналаприл", "10 мг", "2 раза в день"),
            ("Левотироксин", "100 мкг", "1 раз в день утром натощак"),
            ("Диклофенак", "50 мг", "2 раза в день после еды"),
            ("Ибупрофен", "400 мг", "3 раза в день")
        ]

        print("Создание лекарственных назначений...")
        medications_count = 0

        for patient in self.patients:
            # У каждого пациента может быть 0-5 назначений
            num_medications = random.choices([0, 1, 2, 3, 4, 5], weights=[20, 30, 25, 15, 8, 2])[0]

            for _ in range(num_medications):
                med_info = random.choice(medications_list)
                start_date = fake.date_time_between(start_date='-1y', end_date='now')

                # Некоторые препараты имеют дату окончания
                end_date = None
                if random.random() < 0.4:  # 40% имеют дату окончания
                    end_date = start_date + datetime.timedelta(days=random.randint(7, 90))

                medication = Medication(
                    patient_id=patient.id,
                    name=med_info[0],
                    dosage=med_info[1],
                    frequency=med_info[2],
                    start_date=start_date,
                    end_date=end_date,
                    prescribed_by=random.choice(self.doctors).id
                )
                self.session.add(medication)
                medications_count += 1

        self.session.commit()
        print(f"Создано {medications_count} лекарственных назначений")

    def create_medical_tests(self):
        """Создание медицинских исследований"""
        test_types = [
            ("ЭКГ", "В пределах нормы. Синусовый ритм, ЧСС 72 уд/мин"),
            ("УЗИ брюшной полости", "Печень не увеличена, эхогенность обычная. Желчный пузырь без патологии"),
            ("Рентген грудной клетки", "Легочные поля чистые, сердце в норме"),
            ("МРТ головного мозга", "Патологических изменений не выявлено"),
            ("Эхокардиография", "ФВ ЛЖ 65%. Клапанный аппарат без патологии"),
            ("Гастроскопия", "Слизистая желудка гиперемирована. Признаки гастрита"),
            ("Колоноскопия", "Патологических изменений не выявлено"),
            ("Спирометрия", "ЖЕЛ 95% от должной. ОФВ1 92%")
        ]

        print("Создание медицинских исследований...")
        tests_count = 0

        for patient in self.patients:
            # У каждого пациента может быть 0-3 исследования
            num_tests = random.choices([0, 1, 2, 3], weights=[30, 40, 20, 10])[0]

            for _ in range(num_tests):
                test_info = random.choice(test_types)

                medical_test = MedicalTest(
                    patient_id=patient.id,
                    ordered_by=random.choice(self.doctors).id,
                    date=fake.date_time_between(start_date='-1y', end_date='now'),
                    name=test_info[0],
                    results=test_info[1] + (f" Дополнительные комментарии: {fake.text(max_nb_chars=100)}"
                                            if random.random() < 0.3 else ""),
                    attachment_url=f"/files/tests/{fake.random_number(digits=8)}.pdf"
                    if random.random() < 0.5 else None
                )
                self.session.add(medical_test)
                tests_count += 1

        self.session.commit()
        print(f"Создано {tests_count} медицинских исследований")

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
        # Убираем потенциально проблемные типы анализов
        test_types = ['blood_count', 'biochemistry', 'lipid_panel', 'thyroid_panel']
        selected_types = random.sample(test_types, random.randint(1, 3))

        for test_type in selected_types:
            try:
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

                elif test_type == 'thyroid_panel':
                    thyroid = ThyroidPanel(
                        lab_test_id=lab_test.id,
                        tsh=round(random.uniform(0.4, 4.0), 2),
                        t3_free=round(random.uniform(2.3, 4.2), 1),
                        t4_free=round(random.uniform(0.8, 1.8), 1)
                    )
                    self.session.add(thyroid)

            except Exception as e:
                print(f"Ошибка при создании анализа {test_type}: {e}")
                continue

    def create_visits(self):
        """Создание визитов к врачам"""
        print("Создание визитов к врачам...")

        reasons = [
            "Плановый осмотр", "Жалобы на боли в груди", "Контроль артериального давления",
            "Головные боли", "Профилактический осмотр", "Контроль сахара крови",
            "Боли в спине", "Простудные симптомы", "Консультация по результатам анализов",
            "Вакцинация", "Выписка рецепта", "Контроль после лечения"
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
            # Очистка существующих данных
            self.clear_all_data()

            # Создание основных сущностей
            self.create_doctors(count=20)
            self.create_patients(count=100)
            self.create_family_members(count=30)
            self.create_devices(count=200)

            # Создание связей
            self.create_patient_doctor_relationships()
            self.create_family_access()

            # Создание временных данных
            self.create_sensor_readings(days_back=60, readings_per_day=24)
            self.create_heart_data(days_back=60)

            # Создание медицинских данных
            self.create_diagnoses()
            self.create_medications()
            self.create_medical_tests()
            self.create_lab_tests()
            self.create_visits()

            print("\n=== Заполнение завершено успешно! ===")
            print("\nСтатистика созданных данных:")
            print(f"- Врачи: {len(self.doctors)}")
            print(f"- Пациенты: {len(self.patients)}")
            print(f"- Члены семьи: {len(self.family_members)}")
            print(f"- Устройства: {len(self.devices)}")

            # Статистика по записям
            sensor_count = self.session.query(SensorReading).count()
            heart_count = self.session.query(HeartData).count()
            diagnosis_count = self.session.query(Diagnosis).count()
            medication_count = self.session.query(Medication).count()
            medical_test_count = self.session.query(MedicalTest).count()
            lab_count = self.session.query(LabTest).count()
            visit_count = self.session.query(Visit).count()
            patient_doctor_count = self.session.query(PatientDoctor).count()
            family_access_count = self.session.query(FamilyAccess).count()

            print(f"- Показания датчиков: {sensor_count}")
            print(f"- Кардиологические данные: {heart_count}")
            print(f"- Диагнозы: {diagnosis_count}")
            print(f"- Лекарственные назначения: {medication_count}")
            print(f"- Медицинские исследования: {medical_test_count}")
            print(f"- Лабораторные анализы: {lab_count}")
            print(f"- Визиты к врачам: {visit_count}")
            print(f"- Связи пациент-врач: {patient_doctor_count}")
            print(f"- Семейный доступ: {family_access_count}")

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
            AVG(heart_rate) as avg_heart_rate,
            MIN(heart_rate) as min_heart_rate,
            MAX(heart_rate) as max_heart_rate
        FROM med_heart_datas 
        WHERE timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(timestamp)
        ORDER BY time;
        """,

        "Активность устройств": """
        SELECT 
            DATE(timestamp) as time,
            COUNT(DISTINCT device_id) as active_devices
        FROM med_sensor_readings 
        WHERE timestamp >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(timestamp)
        ORDER BY time;
        """,

        "Количество новых диагнозов по месяцам": """
        SELECT 
            DATE_TRUNC('month', date) as time,
            COUNT(*) as diagnoses_count,
            COUNT(DISTINCT patient_id) as unique_patients
        FROM med_diagnoses 
        WHERE date >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', date)
        ORDER BY time;
        """,

        "Топ диагнозов": """
        SELECT 
            title,
            COUNT(*) as count,
            COUNT(DISTINCT patient_id) as patients_count
        FROM med_diagnoses 
        GROUP BY title
        ORDER BY count DESC
        LIMIT 10;
        """,

        "Активные лекарственные назначения": """
        SELECT 
            name as medication,
            COUNT(*) as prescriptions_count,
            COUNT(DISTINCT patient_id) as patients_count
        FROM med_medications
        WHERE end_date IS NULL OR end_date > NOW()
        GROUP BY name
        ORDER BY prescriptions_count DESC
        LIMIT 15;
        """,

        "Визиты к врачам по специальностям": """
        SELECT 
            d.specialty,
            COUNT(v.id) as visits_count,
            COUNT(DISTINCT v.patient_id) as unique_patients
        FROM med_visits v
        JOIN med_doctors d ON v.doctor_id = d.id
        WHERE v.date >= NOW() - INTERVAL '3 months'
        GROUP BY d.specialty
        ORDER BY visits_count DESC;
        """,

        "Динамика лабораторных анализов": """
        SELECT 
            DATE_TRUNC('week', test_date) as time,
            COUNT(*) as tests_count,
            COUNT(DISTINCT patient_id) as patients_tested
        FROM med_lab_tests
        WHERE test_date >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('week', test_date)
        ORDER BY time;
        """,

        "Семейный мониторинг - активные связи": """
        SELECT 
            relationship_type,
            COUNT(*) as count,
            SUM(CASE WHEN receive_critical_alerts THEN 1 ELSE 0 END) as with_alerts
        FROM med_family_accesses
        WHERE is_active = true
        GROUP BY relationship_type
        ORDER BY count DESC;
        """,

        "Среднее артериальное давление по возрастным группам": """
        SELECT 
            CASE 
                WHEN EXTRACT(YEAR FROM AGE(up.birth_date)) < 30 THEN '< 30'
                WHEN EXTRACT(YEAR FROM AGE(up.birth_date)) < 40 THEN '30-39'
                WHEN EXTRACT(YEAR FROM AGE(up.birth_date)) < 50 THEN '40-49'
                WHEN EXTRACT(YEAR FROM AGE(up.birth_date)) < 60 THEN '50-59'
                ELSE '60+'
            END as age_group,
            AVG(hd.blood_pressure_systolic) as avg_systolic,
            AVG(hd.blood_pressure_diastolic) as avg_diastolic,
            COUNT(DISTINCT u.id) as patients_count
        FROM med_heart_datas hd
        JOIN med_devices d ON hd.device_id = d.id
        JOIN med_users u ON d.user_id = u.id
        JOIN med_user_profiles up ON u.id = up.user_id
        WHERE hd.timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY age_group
        ORDER BY age_group;
        """,

        "Уровень глюкозы - отклонения от нормы": """
        SELECT 
            DATE(lt.test_date) as time,
            COUNT(CASE WHEN b.glucose > 6.1 THEN 1 END) as high_glucose,
            COUNT(CASE WHEN b.glucose < 3.9 THEN 1 END) as low_glucose,
            COUNT(CASE WHEN b.glucose BETWEEN 3.9 AND 6.1 THEN 1 END) as normal_glucose
        FROM med_lab_tests lt
        JOIN med_biochemistries b ON lt.id = b.lab_test_id
        WHERE lt.test_date >= NOW() - INTERVAL '3 months'
        GROUP BY DATE(lt.test_date)
        ORDER BY time;
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