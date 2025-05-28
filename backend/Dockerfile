FROM python:3.11-slim



# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libpq-dev \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements

WORKDIR /app
COPY backend/requirements.txt .

# Устанавливаем зависимости Python
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

EXPOSE 8045

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8045", "--reload"]