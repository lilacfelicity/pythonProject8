# Используем официальный образ Apache Airflow с нужной версией Python
FROM apache/airflow:2.7.3-python3.11

# Копируем файл с зависимостями
COPY requirements-airflow.txt .

# Устанавливаем дополнительные зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем DAG'и и плагины, если нужно
COPY ./dags /opt/airflow/dags
COPY ./plugins /opt/airflow/plugins
