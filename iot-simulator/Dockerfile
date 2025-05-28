FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir aiohttp==3.9.1

# Copy simulator
COPY simulator.py .

# Run simulator
CMD ["python", "simulator.py"]