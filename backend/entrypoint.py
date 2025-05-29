#!/usr/bin/env python
import os
import sys
import time
import subprocess
import socket


def wait_for_postgres():
    """Wait for PostgreSQL to be ready"""
    db_host = os.getenv('DB_HOST', 'postgres')
    db_port = int(os.getenv('DB_PORT', '5432'))

    print(f"Waiting for PostgreSQL at {db_host}:{db_port}...")

    while True:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex((db_host, db_port))
            sock.close()

            if result == 0:
                print("PostgreSQL is ready!")
                break
        except:
            pass

        time.sleep(1)


def run_migrations():
    """Run Alembic migrations"""
    print("Running database migrations...")
    result = subprocess.run(['alembic', 'upgrade', 'head'], capture_output=True, text=True)

    if result.returncode == 0:
        print("Migrations completed successfully")
        print(result.stdout)
    else:
        print("Migration failed!")
        print(result.stderr)
        sys.exit(1)


def main():
    """Main entrypoint"""
    wait_for_postgres()
    run_migrations()

    # Start the application
    print("Starting application...")
    os.execvp('uvicorn', ['uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8045', '--reload'])


if __name__ == "__main__":
    main()