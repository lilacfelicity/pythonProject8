FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories
RUN mkdir -p /app/api /app/core /app/services /app/migrations/versions

# Make entrypoint executable
RUN chmod +x entrypoint.py

EXPOSE 8045

ENTRYPOINT ["python", "entrypoint.py"]