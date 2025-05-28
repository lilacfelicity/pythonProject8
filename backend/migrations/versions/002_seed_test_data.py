"""Seed test data

Revision ID: 002
Revises: 001
Create Date: 2024-01-01 00:00:01.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Insert test user
    op.execute("""
        INSERT INTO users (username, email, password_hash, role, is_active, created_at)
        VALUES (
            'ekaterina', 
            'ekaterina.smirnova@email.com',
            '8ac76453d769d4fd14b3f41ad4933f9bd9321846c0a1cb689ee1c2a1c37d2f68',  -- demo123
            'patient',
            true,
            CURRENT_TIMESTAMP
        )
    """)

    # Insert user profile
    op.execute("""
        INSERT INTO user_profiles (
            user_id, first_name, last_name, patronymic, 
            birth_date, gender, phone_number, blood_type, 
            height, weight, allergies, chronic_conditions
        )
        SELECT 
            id, 'Екатерина', 'Смирнова', 'Алексеевна',
            '2001-03-11', 'female', '+7 (999) 123-45-67', 'A(II) Rh+',
            165, 58, 'Нет данных', 'Нет данных'
        FROM users WHERE email = 'ekaterina.smirnova@email.com'
    """)

    # Insert test devices
    op.execute("""
        INSERT INTO devices (name, device_id, user_id, status, created_at)
        SELECT 'Пульсоксиметр', 'PULSE_001', id, 'active', CURRENT_TIMESTAMP
        FROM users WHERE email = 'ekaterina.smirnova@email.com'
    """)

    op.execute("""
        INSERT INTO devices (name, device_id, user_id, status, created_at)
        SELECT 'Тонометр', 'BP_001', id, 'active', CURRENT_TIMESTAMP
        FROM users WHERE email = 'ekaterina.smirnova@email.com'
    """)

    op.execute("""
        INSERT INTO devices (name, device_id, user_id, status, created_at)
        SELECT 'Мультисенсор', 'MULTI_001', id, 'active', CURRENT_TIMESTAMP
        FROM users WHERE email = 'ekaterina.smirnova@email.com'
    """)

    # Insert test doctors
    op.execute("""
        INSERT INTO doctors (name, specialty, phone, email)
        VALUES 
            ('Сидорова Анна Владимировна', 'Терапевт', '+7 (999) 111-22-33', 'sidorova@clinic.ru'),
            ('Петрова Наталья Ивановна', 'Аллерголог', '+7 (999) 222-33-44', 'petrova@clinic.ru'),
            ('Иванова Елена Петровна', 'Кардиолог', '+7 (999) 333-44-55', 'ivanova@clinic.ru')
    """)

    # Create aggregation tables for analytics
    op.execute("""
        CREATE TABLE IF NOT EXISTS hourly_vitals_summary (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            hour_timestamp TIMESTAMP NOT NULL,
            readings_count INTEGER,
            heart_rate_avg FLOAT,
            heart_rate_min FLOAT,
            heart_rate_max FLOAT,
            spo2_avg FLOAT,
            spo2_min FLOAT,
            temperature_avg FLOAT,
            temperature_max FLOAT,
            bp_systolic_avg FLOAT,
            bp_systolic_max FLOAT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, hour_timestamp)
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS generated_alerts (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            alert_type VARCHAR(50),
            severity VARCHAR(20),
            metric_name VARCHAR(50),
            metric_value FLOAT,
            message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create indexes for analytics tables
    op.create_index('idx_hourly_vitals_user_timestamp', 'hourly_vitals_summary', ['user_id', 'hour_timestamp'])
    op.create_index('idx_alerts_user_created', 'generated_alerts', ['user_id', 'created_at'])


def downgrade() -> None:
    # Drop analytics tables
    op.drop_table('generated_alerts')
    op.drop_table('hourly_vitals_summary')

    # Delete test data
    op.execute("DELETE FROM devices WHERE device_id IN ('PULSE_001', 'BP_001', 'MULTI_001')")
    op.execute("DELETE FROM doctors WHERE email IN ('sidorova@clinic.ru', 'petrova@clinic.ru', 'ivanova@clinic.ru')")
    op.execute(
        "DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email = 'ekaterina.smirnova@email.com')")
    op.execute("DELETE FROM users WHERE email = 'ekaterina.smirnova@email.com'")