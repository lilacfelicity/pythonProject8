"""Initial schema

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enums
    op.execute("CREATE TYPE userrole AS ENUM ('patient', 'doctor', 'family_member', 'admin')")
    op.execute("CREATE TYPE devicestatus AS ENUM ('active', 'inactive')")

    # Create users table
    op.create_table('users',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('username', sa.String(length=50), nullable=False),
                    sa.Column('email', sa.String(length=255), nullable=False),
                    sa.Column('password_hash', sa.String(length=255), nullable=False),
                    sa.Column('last_password_change', sa.DateTime(), nullable=True),
                    sa.Column('role', postgresql.ENUM('patient', 'doctor', 'family_member', 'admin', name='userrole'),
                              nullable=False),
                    sa.Column('is_active', sa.Boolean(), nullable=False),
                    sa.Column('created_at', sa.DateTime(), nullable=False),
                    sa.Column('failed_login_attempts', sa.Integer(), nullable=True),
                    sa.Column('account_locked_until', sa.DateTime(), nullable=True),
                    sa.Column('last_login', sa.DateTime(), nullable=True),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # Create devices table
    op.create_table('devices',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('name', sa.String(length=100), nullable=False),
                    sa.Column('description', sa.Text(), nullable=True),
                    sa.Column('device_id', sa.String(length=50), nullable=False),
                    sa.Column('user_id', sa.Integer(), nullable=False),
                    sa.Column('status', postgresql.ENUM('active', 'inactive', name='devicestatus'), nullable=False),
                    sa.Column('last_seen', sa.DateTime(), nullable=True),
                    sa.Column('created_at', sa.DateTime(), nullable=False),
                    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index('idx_device_last_seen', 'devices', ['last_seen'], unique=False)
    op.create_index('idx_device_user_active', 'devices', ['user_id', 'status'], unique=False)
    op.create_index(op.f('ix_devices_device_id'), 'devices', ['device_id'], unique=True)
    op.create_index(op.f('ix_devices_id'), 'devices', ['id'], unique=False)

    # Create user_profiles table
    op.create_table('user_profiles',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('user_id', sa.Integer(), nullable=False),
                    sa.Column('first_name', sa.String(length=50), nullable=False),
                    sa.Column('last_name', sa.String(length=50), nullable=False),
                    sa.Column('patronymic', sa.String(length=50), nullable=True),
                    sa.Column('birth_date', sa.DateTime(), nullable=False),
                    sa.Column('gender', sa.String(length=10), nullable=False),
                    sa.Column('phone_number', sa.String(length=20), nullable=False),
                    sa.Column('address', sa.Text(), nullable=True),
                    sa.Column('emergency_contact', sa.String(length=100), nullable=True),
                    sa.Column('blood_type', sa.String(length=5), nullable=True),
                    sa.Column('height', sa.Integer(), nullable=True),
                    sa.Column('weight', sa.Integer(), nullable=True),
                    sa.Column('allergies', sa.Text(), nullable=True),
                    sa.Column('chronic_conditions', sa.Text(), nullable=True),
                    sa.Column('insurance_number', sa.String(length=50), nullable=True),
                    sa.Column('insurance_company', sa.String(length=100), nullable=True),
                    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
                    sa.PrimaryKeyConstraint('id'),
                    sa.UniqueConstraint('user_id')
                    )
    op.create_index(op.f('ix_user_profiles_id'), 'user_profiles', ['id'], unique=False)

    # Create doctors table
    op.create_table('doctors',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('name', sa.String(length=100), nullable=False),
                    sa.Column('specialty', sa.String(length=100), nullable=False),
                    sa.Column('phone', sa.String(length=20), nullable=True),
                    sa.Column('email', sa.String(length=255), nullable=True),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index(op.f('ix_doctors_id'), 'doctors', ['id'], unique=False)

    # Create sensor_readings table
    op.create_table('sensor_readings',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('device_id', sa.Integer(), nullable=False),
                    sa.Column('timestamp', sa.DateTime(), nullable=False),
                    sa.Column('temperature', sa.Float(), nullable=True),
                    sa.Column('humidity', sa.Float(), nullable=True),
                    sa.Column('pressure', sa.Float(), nullable=True),
                    sa.Column('light', sa.Float(), nullable=True),
                    sa.Column('motion', sa.Integer(), nullable=True),
                    sa.Column('custom_value1', sa.Float(), nullable=True),
                    sa.Column('custom_value2', sa.Float(), nullable=True),
                    sa.ForeignKeyConstraint(['device_id'], ['devices.id'], ),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index('idx_sensor_device_timestamp', 'sensor_readings', ['device_id', 'timestamp'], unique=False)
    op.create_index(op.f('ix_sensor_readings_id'), 'sensor_readings', ['id'], unique=False)

    # Create heart_data table
    op.create_table('heart_data',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('device_id', sa.Integer(), nullable=False),
                    sa.Column('timestamp', sa.DateTime(), nullable=False),
                    sa.Column('heart_rate', sa.Integer(), nullable=True),
                    sa.Column('spo2', sa.Float(), nullable=True),
                    sa.Column('hrv', sa.Float(), nullable=True),
                    sa.Column('blood_pressure_systolic', sa.Integer(), nullable=True),
                    sa.Column('blood_pressure_diastolic', sa.Integer(), nullable=True),
                    sa.Column('temperature', sa.Float(), nullable=True),
                    sa.Column('activity_level', sa.Integer(), nullable=True),
                    sa.ForeignKeyConstraint(['device_id'], ['devices.id'], ),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index('idx_heart_device_timestamp', 'heart_data', ['device_id', 'timestamp'], unique=False)
    op.create_index(op.f('ix_heart_data_id'), 'heart_data', ['id'], unique=False)

    # Create lab_tests table
    op.create_table('lab_tests',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('patient_id', sa.Integer(), nullable=False),
                    sa.Column('test_date', sa.DateTime(), nullable=False),
                    sa.Column('lab_name', sa.String(length=100), nullable=False),
                    sa.Column('reference_number', sa.String(length=50), nullable=True),
                    sa.Column('doctor_id', sa.Integer(), nullable=True),
                    sa.Column('notes', sa.Text(), nullable=True),
                    sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id'], ),
                    sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index(op.f('ix_lab_tests_id'), 'lab_tests', ['id'], unique=False)

    # Create patient_doctors table
    op.create_table('patient_doctors',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('patient_id', sa.Integer(), nullable=False),
                    sa.Column('doctor_id', sa.Integer(), nullable=False),
                    sa.Column('is_primary', sa.Boolean(), nullable=False),
                    sa.Column('assigned_date', sa.DateTime(), nullable=False),
                    sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id'], ),
                    sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index(op.f('ix_patient_doctors_id'), 'patient_doctors', ['id'], unique=False)

    # Create diagnoses table
    op.create_table('diagnoses',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('patient_id', sa.Integer(), nullable=False),
                    sa.Column('doctor_id', sa.Integer(), nullable=False),
                    sa.Column('date', sa.DateTime(), nullable=False),
                    sa.Column('title', sa.String(length=200), nullable=False),
                    sa.Column('status', sa.String(length=20), nullable=False),
                    sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id'], ),
                    sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index(op.f('ix_diagnoses_id'), 'diagnoses', ['id'], unique=False)

    # Create medications table
    op.create_table('medications',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('patient_id', sa.Integer(), nullable=False),
                    sa.Column('name', sa.String(length=200), nullable=False),
                    sa.Column('dosage', sa.String(length=100), nullable=False),
                    sa.Column('frequency', sa.String(length=100), nullable=False),
                    sa.Column('start_date', sa.DateTime(), nullable=False),
                    sa.Column('end_date', sa.DateTime(), nullable=True),
                    sa.Column('prescribed_by', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ),
                    sa.ForeignKeyConstraint(['prescribed_by'], ['doctors.id'], ),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index(op.f('ix_medications_id'), 'medications', ['id'], unique=False)

    # Create visits table
    op.create_table('visits',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('patient_id', sa.Integer(), nullable=False),
                    sa.Column('doctor_id', sa.Integer(), nullable=False),
                    sa.Column('date', sa.DateTime(), nullable=False),
                    sa.Column('reason', sa.String(length=500), nullable=False),
                    sa.Column('notes', sa.Text(), nullable=True),
                    sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id'], ),
                    sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index(op.f('ix_visits_id'), 'visits', ['id'], unique=False)

    # Create medical_tests table
    op.create_table('medical_tests',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('patient_id', sa.Integer(), nullable=False),
                    sa.Column('ordered_by', sa.Integer(), nullable=False),
                    sa.Column('date', sa.DateTime(), nullable=False),
                    sa.Column('name', sa.String(length=200), nullable=False),
                    sa.Column('results', sa.Text(), nullable=False),
                    sa.Column('attachment_url', sa.String(length=500), nullable=True),
                    sa.ForeignKeyConstraint(['ordered_by'], ['doctors.id'], ),
                    sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index(op.f('ix_medical_tests_id'), 'medical_tests', ['id'], unique=False)

    # Create family_access table
    op.create_table('family_access',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('patient_id', sa.Integer(), nullable=False),
                    sa.Column('family_member_id', sa.Integer(), nullable=False),
                    sa.Column('relationship_type', sa.String(length=50), nullable=False),
                    sa.Column('is_active', sa.Boolean(), nullable=False),
                    sa.Column('date_granted', sa.DateTime(), nullable=False),
                    sa.Column('expiry_date', sa.DateTime(), nullable=True),
                    sa.Column('can_view_diagnoses', sa.Boolean(), nullable=False),
                    sa.Column('can_view_medications', sa.Boolean(), nullable=False),
                    sa.Column('can_view_lab_tests', sa.Boolean(), nullable=False),
                    sa.Column('can_view_visits', sa.Boolean(), nullable=False),
                    sa.Column('can_view_vitals', sa.Boolean(), nullable=False),
                    sa.Column('can_view_devices', sa.Boolean(), nullable=False),
                    sa.Column('receive_critical_alerts', sa.Boolean(), nullable=False),
                    sa.Column('notes', sa.Text(), nullable=True),
                    sa.ForeignKeyConstraint(['family_member_id'], ['users.id'], ),
                    sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index('idx_family_member_active', 'family_access', ['family_member_id', 'is_active'], unique=False)
    op.create_index('idx_family_patient_active', 'family_access', ['patient_id', 'is_active'], unique=False)
    op.create_index(op.f('ix_family_access_id'), 'family_access', ['id'], unique=False)

    # Create specialized lab test tables
    # Blood count
    op.create_table('blood_count',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('lab_test_id', sa.Integer(), nullable=False),
                    sa.Column('hemoglobin', sa.Float(), nullable=True),
                    sa.Column('erythrocytes', sa.Float(), nullable=True),
                    sa.Column('hematocrit', sa.Float(), nullable=True),
                    sa.Column('leukocytes', sa.Float(), nullable=True),
                    sa.Column('platelets', sa.Float(), nullable=True),
                    sa.Column('esr', sa.Float(), nullable=True),
                    sa.Column('neutrophils_percent', sa.Float(), nullable=True),
                    sa.Column('lymphocytes_percent', sa.Float(), nullable=True),
                    sa.Column('monocytes_percent', sa.Float(), nullable=True),
                    sa.Column('eosinophils_percent', sa.Float(), nullable=True),
                    sa.Column('basophils_percent', sa.Float(), nullable=True),
                    sa.ForeignKeyConstraint(['lab_test_id'], ['lab_tests.id'], ),
                    sa.PrimaryKeyConstraint('id'),
                    sa.UniqueConstraint('lab_test_id')
                    )
    op.create_index(op.f('ix_blood_count_id'), 'blood_count', ['id'], unique=False)

    # Other lab test tables (biochemistry, etc.) would follow the same pattern...


def downgrade() -> None:
    # Drop all tables in reverse order
    op.drop_table('blood_count')
    op.drop_table('family_access')
    op.drop_table('medical_tests')
    op.drop_table('visits')
    op.drop_table('medications')
    op.drop_table('diagnoses')
    op.drop_table('patient_doctors')
    op.drop_table('lab_tests')
    op.drop_table('heart_data')
    op.drop_table('sensor_readings')
    op.drop_table('doctors')
    op.drop_table('user_profiles')
    op.drop_table('devices')
    op.drop_table('users')

    # Drop enums
    op.execute('DROP TYPE devicestatus')
    op.execute('DROP TYPE userrole')