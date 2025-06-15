from sqlalchemy import Column, LargeBinary, Integer, String, Float, DateTime, Boolean, ForeignKey, Enum, Text, Index
from sqlalchemy.ext.declarative import declarative_base, declared_attr
from sqlalchemy.orm import relationship, backref
from database import Base

import datetime
import enum
import os

TABLE_PREFIX = os.getenv("TABLE_PREFIX", "med_")

class PrefixedBase:
    """
    Базовый класс который автоматически добавляет префикс к именам таблиц
    """
    @declared_attr
    def __tablename__(cls):
        # Конвертируем CamelCase в snake_case и добавляем префикс
        name = cls.__name__
        # UserProfile -> user_profile, HeartData -> heart_data
        import re
        name = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
        name = re.sub('([a-z0-9])([A-Z])', r'\1_\2', name).lower()
        return f"{TABLE_PREFIX}{name}s"

# Создаем новый Base с нашим кастомным классом
Base = declarative_base(cls=PrefixedBase)

class UserRole(enum.Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    FAMILY_MEMBER = "family_member"
    ADMIN = "admin"


class DeviceStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class User(Base):
    """Усиленная модель пользователя с реальной безопасностью"""

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)

    # ИСПРАВЛЕНО: используем password_hash везде
    password_hash = Column(String(255), nullable=False)
    last_password_change = Column(DateTime, default=datetime.datetime.utcnow)


    # Базовые поля
    role = Column(Enum(UserRole), default=UserRole.PATIENT, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Дополнительные поля безопасности
    failed_login_attempts = Column(Integer, default=0)
    account_locked_until = Column(DateTime, nullable=True)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    devices = relationship("Device", back_populates="owner")
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    lab_tests = relationship("LabTest", back_populates="patient")
    doctors = relationship("PatientDoctor", back_populates="patient")
    diagnoses = relationship("Diagnosis", back_populates="patient")
    medications = relationship("Medication", back_populates="patient")
    visits = relationship("Visit", back_populates="patient")
    medical_tests = relationship("MedicalTest", back_populates="patient")


class Device(Base):
    """IoT устройства с оптимизированными индексами"""

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    device_id = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX}users.id"), nullable=False)

    status = Column(Enum(DeviceStatus), default=DeviceStatus.ACTIVE, nullable=False)
    last_seen = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    owner = relationship("User", back_populates="devices")
    readings = relationship("SensorReading", back_populates="device")
    heart_readings = relationship("HeartData", back_populates="device")

    __table_args__ = (
        Index(f'idx_{TABLE_PREFIX}device_user_active', 'user_id', 'status'),
        Index(f'idx_{TABLE_PREFIX}device_last_seen', 'last_seen'),
    )


class SensorReading(Base):
    """Данные с датчиков окружающей среды"""

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX}devices.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    pressure = Column(Float, nullable=True)
    light = Column(Float, nullable=True)
    motion = Column(Integer, nullable=True)
    custom_value1 = Column(Float, nullable=True)
    custom_value2 = Column(Float, nullable=True)

    device = relationship("Device", back_populates="readings")

    __table_args__ = (
        Index(f'idx_{TABLE_PREFIX}sensor_device_timestamp', 'device_id', 'timestamp'),
    )


class HeartData(Base):
    """Кардиологические данные"""

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX}devices.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    heart_rate = Column(Integer, nullable=True)
    spo2 = Column(Float, nullable=True)
    hrv = Column(Float, nullable=True)
    blood_pressure_systolic = Column(Integer, nullable=True)
    blood_pressure_diastolic = Column(Integer, nullable=True)
    temperature = Column(Float, nullable=True)
    activity_level = Column(Integer, nullable=True)

    device = relationship("Device", back_populates="heart_readings")

    __table_args__ = (
        Index('idx_{TABLE_PREFIX}heart_device_timestamp', 'device_id', 'timestamp'),
    )


class UserProfile(Base):
    """Профиль пользователя"""

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX}users.id"), unique=True, nullable=False)

    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    patronymic = Column(String(50), nullable=True)
    birth_date = Column(DateTime, nullable=False)
    gender = Column(String(10), nullable=False)

    phone_number = Column(String(20), nullable=False)
    address = Column(Text, nullable=True)
    emergency_contact = Column(String(100), nullable=True)

    blood_type = Column(String(5), nullable=True)
    height = Column(Integer, nullable=True)
    weight = Column(Integer, nullable=True)
    allergies = Column(Text, nullable=True)
    chronic_conditions = Column(Text, nullable=True)

    insurance_number = Column(String(50), nullable=True)
    insurance_company = Column(String(100), nullable=True)

    user = relationship("User", back_populates="profile")


class Doctor(Base):
    """Врачи в системе"""

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    specialty = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)

    medical_tests = relationship("MedicalTest", back_populates="doctor")
    patients = relationship("PatientDoctor", back_populates="doctor")
    visits = relationship("Visit", back_populates="doctor")
    diagnoses = relationship("Diagnosis", back_populates="doctor")


class PatientDoctor(Base):
    """Связь пациент-врач"""

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX}users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX}doctors.id"), nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)
    assigned_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    patient = relationship("User", back_populates="doctors")
    doctor = relationship("Doctor", back_populates="patients")


class Diagnosis(Base):
    """Диагнозы пациентов"""

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX}users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX}doctors.id"), nullable=False)
    date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    title = Column(String(200), nullable=False)
    status = Column(String(20), default="active", nullable=False)

    patient = relationship("User", back_populates="diagnoses")
    doctor = relationship("Doctor", back_populates="diagnoses")


class Medication(Base):
    """Лекарственные назначения"""

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX}users.id"), nullable=False)
    name = Column(String(200), nullable=False)
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    prescribed_by = Column(Integer, ForeignKey(f"{TABLE_PREFIX}doctors.id"), nullable=False)

    patient = relationship("User", back_populates="medications")
    doctor = relationship("Doctor")


class Visit(Base):
    """Визиты к врачам"""

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX}users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX}doctors.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    reason = Column(String(500), nullable=False)
    notes = Column(Text, nullable=True)

    patient = relationship("User", back_populates="visits")
    doctor = relationship("Doctor", back_populates="visits")


class MedicalTest(Base):
    """Медицинские исследования"""

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX}users.id"), nullable=False)
    ordered_by = Column(Integer, ForeignKey(f"{TABLE_PREFIX}doctors.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    name = Column(String(200), nullable=False)
    results = Column(Text, nullable=False)
    attachment_url = Column(String(500), nullable=True)

    patient = relationship("User", back_populates="medical_tests")
    doctor = relationship("Doctor", back_populates="medical_tests")


class FamilyAccess(Base):
    """Система семейного доступа"""

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX}users.id"), nullable=False)
    family_member_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX}users.id"), nullable=False)
    relationship_type = Column(String(50), nullable=False)

    is_active = Column(Boolean, default=True, nullable=False)
    date_granted = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    expiry_date = Column(DateTime, nullable=True)

    can_view_diagnoses = Column(Boolean, default=True, nullable=False)
    can_view_medications = Column(Boolean, default=True, nullable=False)
    can_view_lab_tests = Column(Boolean, default=True, nullable=False)
    can_view_visits = Column(Boolean, default=True, nullable=False)
    can_view_vitals = Column(Boolean, default=True, nullable=False)
    can_view_devices = Column(Boolean, default=True, nullable=False)
    receive_critical_alerts = Column(Boolean, default=True, nullable=False)
    notes = Column(Text, nullable=True)

    patient = relationship("User", foreign_keys=[patient_id], backref="family_access_granted")
    family_member = relationship("User", foreign_keys=[family_member_id], backref="family_access_received")

    __table_args__ = (
        Index(f'idx_{TABLE_PREFIX}family_patient_active', 'patient_id', 'is_active'),
        Index(f'idx_{TABLE_PREFIX}family_member_active', 'family_member_id', 'is_active'),
    )


class LabTest(Base):
    """Базовая модель лабораторного исследования"""

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX}users.id"), nullable=False)
    test_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    lab_name = Column(String(100), nullable=False)
    reference_number = Column(String(50), nullable=True)
    doctor_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX}doctors.id"), nullable=True)
    notes = Column(Text, nullable=True)

    patient = relationship("User", back_populates="lab_tests")
    doctor = relationship("Doctor", backref="ordered_lab_tests")


class BloodCount(Base):
    """Общий анализ крови"""

    id = Column(Integer, primary_key=True, index=True)
    lab_test_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX}lab_tests.id"), unique=True, nullable=False)

    hemoglobin = Column(Float, nullable=True)
    erythrocytes = Column(Float, nullable=True)
    hematocrit = Column(Float, nullable=True)
    leukocytes = Column(Float, nullable=True)
    platelets = Column(Float, nullable=True)
    esr = Column(Float, nullable=True)

    neutrophils_percent = Column(Float, nullable=True)
    lymphocytes_percent = Column(Float, nullable=True)
    monocytes_percent = Column(Float, nullable=True)
    eosinophils_percent = Column(Float, nullable=True)
    basophils_percent = Column(Float, nullable=True)

    lab_test = relationship("LabTest", backref=backref("blood_count", uselist=False))


class Biochemistry(Base):
    """Биохимический анализ крови"""

    id = Column(Integer, primary_key=True, index=True)
    lab_test_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX}lab_tests.id"), unique=True, nullable=False)

    glucose = Column(Float, nullable=True)
    creatinine = Column(Float, nullable=True)
    urea = Column(Float, nullable=True)
    alt = Column(Float, nullable=True)
    ast = Column(Float, nullable=True)
    total_bilirubin = Column(Float, nullable=True)
    total_protein = Column(Float, nullable=True)
    albumin = Column(Float, nullable=True)

    sodium = Column(Float, nullable=True)
    potassium = Column(Float, nullable=True)
    calcium = Column(Float, nullable=True)
    crp = Column(Float, nullable=True)

    lab_test = relationship("LabTest", backref=backref("biochemistry", uselist=False))


class LipidPanel(Base):
    """Липидный профиль"""

    id = Column(Integer, primary_key=True, index=True)
    lab_test_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX}lab_tests.id"), unique=True, nullable=False)

    total_cholesterol = Column(Float, nullable=True)
    hdl_cholesterol = Column(Float, nullable=True)
    ldl_cholesterol = Column(Float, nullable=True)
    triglycerides = Column(Float, nullable=True)
    cholesterol_hdl_ratio = Column(Float, nullable=True)

    lab_test = relationship("LabTest", backref=backref("lipid_panel", uselist=False))


class ThyroidPanel(Base):
    """Функция щитовидной железы"""

    id = Column(Integer, primary_key=True, index=True)
    lab_test_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX}lab_tests.id"), unique=True, nullable=False)

    tsh = Column(Float, nullable=True)
    t3_free = Column(Float, nullable=True)
    t4_free = Column(Float, nullable=True)

    lab_test = relationship("LabTest", backref=backref("thyroid_panel", uselist=False))


class Urinalysis(Base):
    """Общий анализ мочи"""
    __tablename__ = "urinalysis"

    id = Column(Integer, primary_key=True, index=True)
    lab_test_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX}lab_tests.id"), unique=True, nullable=False)

    protein = Column(String(50), nullable=True)
    glucose = Column(String(50), nullable=True)
    leukocytes = Column(String(50), nullable=True)
    bacteria = Column(String(50), nullable=True)

    lab_test = relationship("LabTest", backref=backref("urinalysis", uselist=False))


class VitaminLevels(Base):
    """Уровни витаминов"""

    id = Column(Integer, primary_key=True, index=True)
    lab_test_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX}lab_tests.id"), unique=True, nullable=False)

    vitamin_b12 = Column(Float, nullable=True)
    vitamin_d = Column(Float, nullable=True)
    ferritin = Column(Float, nullable=True)
    iron = Column(Float, nullable=True)

    lab_test = relationship("LabTest", backref=backref("vitamin_levels", uselist=False))


class CardiacMarkers(Base):
    """Кардиологические маркеры"""

    id = Column(Integer, primary_key=True, index=True)
    lab_test_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX}lab_tests.id"), unique=True, nullable=False)

    troponin = Column(Float, nullable=True)
    bnp = Column(Float, nullable=True)

    lab_test = relationship("LabTest", backref=backref("cardiac_markers", uselist=False))


class TumorMarkers(Base):
    """Онкомаркеры"""

    id = Column(Integer, primary_key=True, index=True)
    lab_test_id = Column(Integer, ForeignKey(f"{TABLE_PREFIX}lab_tests.id"), unique=True, nullable=False)

    psa = Column(Float, nullable=True)
    cea = Column(Float, nullable=True)
    ca_125 = Column(Float, nullable=True)

    lab_test = relationship("LabTest", backref=backref("tumor_markers", uselist=False))