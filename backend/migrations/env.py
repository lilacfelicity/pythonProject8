from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
import os
import sys
import re
from pathlib import Path

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))

from database import Base
from models import *  # Import all models
from core.config import settings

config = context.config

# Set database URL from environment
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def include_object(object, name, type_, reflected, compare_to):
    """
    Включаем только таблицы с префиксом med_ и исключаем все остальные
    """
    if type_ == "table":
        # ВКЛЮЧАЕМ только таблицы с нашим префиксом
        if re.match(r'^med_', name):
            print(f"✅ Включаем таблицу: {name}")
            return True

        # ИСКЛЮЧАЕМ все остальные таблицы (включая Grafana)
        print(f"❌ Исключаем таблицу: {name}")
        return False

    elif type_ == "index":
        # Включаем только индексы наших таблиц
        if hasattr(object, 'table') and object.table is not None:
            table_name = object.table.name
            if re.match(r'^med_', table_name):
                return True
        return False

    elif type_ == "foreign_key_constraint":
        # Включаем только внешние ключи между нашими таблицами
        if hasattr(object, 'referred_table') and object.referred_table is not None:
            referred_table = object.referred_table.name
            if re.match(r'^med_', referred_table):
                return True
        return False

    # Для остальных типов объектов (constraints, etc.)
    return True


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    configuration = config.get_section(config.config_ini_section)
    configuration['sqlalchemy.url'] = settings.DATABASE_URL

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_object=include_object,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
