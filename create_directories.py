#!/usr/bin/env python
"""Create directory structure for the project"""
import os

directories = [
    # Backend
    "backend/alembic/versions",
    "backend/api",
    "backend/core",
    "backend/services",

    # Frontend
    "frontend/src/components/Dashboard",
    "frontend/src/components/Layout",
    "frontend/src/services",
    "frontend/src/hooks",
    "frontend/public",

    # Other services
    "iot-simulator",
    "airflow/dags",
    "nginx",

    # Grafana
    "grafana/dashboards",
    "grafana/provisioning/dashboards",
    "grafana/provisioning/datasources",
]

# Create directories
for directory in directories:
    os.makedirs(directory, exist_ok=True)
    print(f"✓ Created: {directory}")

    # Create __init__.py for Python packages
    if directory.startswith(("backend/", "iot-simulator")) and not directory.endswith("versions"):
        init_file = os.path.join(directory, "__init__.py")
        if not os.path.exists(init_file):
            with open(init_file, 'w') as f:
                f.write("# Package marker\n")
            print(f"  + Added __init__.py")

# Create .env from example if not exists
if not os.path.exists('.env') and os.path.exists('.env.example'):
    import shutil

    shutil.copy('.env.example', '.env')
    print("\n✓ Created .env from .env.example")
    print("! Remember to update SALT and SECRET_KEY in .env")

print("\n✅ Directory structure created successfully!")
print("\nNext steps:")
print("1. Copy all the artifact files to their respective directories")
print("2. Update .env file with your configuration")
print("3. Run: docker-compose up -d")