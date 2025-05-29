# Финальная инструкция по запуску системы

## Требования
- Docker и Docker Compose
- Свободный порт 80

## Структура папок

Создайте следующую структуру:

```
medical-monitoring/
├── backend/
│   ├── alembic/
│   │   └── versions/
│   ├── api/
│   ├── core/
│   └── services/
├── frontend/
│   └── src/
│       ├── components/
│       ├── services/
│       └── hooks/
├── iot-simulator/
├── airflow/
│   └── dags/
├── nginx/
└── grafana/
    ├── dashboards/
    └── provisioning/
        ├── dashboards/
        └── datasources/
```

## Шаг 1: Создание .env файла

Создайте файл `.env` в корне проекта:

```bash
# Database
DB_USER=medical_user
DB_PASSWORD=medical_password
DB_NAME=medical_db
DB_HOST=postgres
DB_PORT=5432

# Security
SECRET_KEY=your-secret-key-here
SALT=your-salt-here

# Redis
REDIS_URL=redis://redis:6379

# Airflow
AIRFLOW_FERNET_KEY=U7uFQm0jJ_XpD0OWMxP8BNwfvCXPHgI9qwXhARtNTmg=

# Telegram (optional)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

## Шаг 2: Проверка хеша пароля

Если вы изменили SALT в .env, выполните:

```bash
# Создайте временный Python контейнер
docker run -it --rm -v $(pwd)/backend:/app -w /app python:3.11-slim python generate_password_hash.py

# Обновите хеш в файле backend/alembic/versions/001_initial_migration.py
```

## Шаг 3: Запуск системы

```bash
# Запустить все контейнеры
docker-compose up -d

# Проверить статус (подождать 1-2 минуты)
docker-compose ps

# Проверить логи
docker-compose logs -f backend
```

## Шаг 4: Проверка работы

1. **Frontend**: http://localhost/
   - Логин: ekaterina.smirnova@email.com
   - Пароль: demo123

2. **Grafana**: http://localhost/grafana (admin/admin)
   - Dashboard автоматически создан

3. **Airflow**: http://localhost/airflow (admin/admin)
   - DAG начнет работать автоматически

## Проверка компонентов

### Backend и миграции
```bash
# Проверить применение миграций
docker-compose exec backend alembic current

# Посмотреть логи миграций
docker-compose logs backend | grep -A5 -B5 "migration"
```

### IoT Simulator
```bash
# Проверить генерацию данных
docker-compose logs -f iot-simulator
```

### Redis
```bash
# Проверить подключение
docker-compose exec redis redis-cli ping
```

### PostgreSQL
```bash
# Подключиться к БД
docker-compose exec postgres psql -U medical_user -d medical_db

# Проверить таблицы
\dt

# Проверить данные
SELECT * FROM users;
SELECT * FROM devices;
SELECT COUNT(*) FROM heart_data;
```

## Остановка и очистка

```bash
# Остановить все контейнеры
docker-compose down

# Полная очистка (включая данные)
docker-compose down -v

# Удалить все образы
docker-compose down --rmi all
```

## Troubleshooting

### Ошибка "port 80 already in use"
```bash
# Найти процесс на порту 80
sudo lsof -i :80

# Или использовать другой порт в nginx сервисе
```

### Backend не запускается
```bash
# Проверить миграции вручную
docker-compose run --rm backend alembic upgrade head

# Проверить подключение к БД
docker-compose run --rm backend python -c "from database import engine; print('DB connected')"
```

### WebSocket не работает
- Проверьте что используете http://localhost/ (не localhost:3000)
- WebSocket автоматически проксируется через Nginx

### Grafana не показывает данные
- Подождите пока IoT simulator сгенерирует данные (10-20 секунд)
- Проверьте datasource в Grafana UI

## Архитектурная схема

```
        ┌─────────────┐
        │    Nginx    │ :80
        │(Reverse Proxy)
        └──────┬──────┘
               │
    ┌──────────┼──────────┬──────────┬──────────┐
    │          │          │          │          │
    ▼          ▼          ▼          ▼          ▼
Frontend   Backend   Grafana   Airflow   (WebSocket)
 :3000      :8045     :3000     :8080        /ws
    │          │          │          │
    └──────────┼──────────┴──────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
    PostgreSQL     Redis
      :5432        :6379
```

## Готово!

Система полностью готова к работе. IoT симулятор автоматически генерирует данные, которые:
1. Сохраняются в PostgreSQL
2. Кешируются в Redis
3. Отображаются в real-time через WebSocket
4. Визуализируются в Grafana
5. Обрабатываются Airflow каждые 15 минут