#!/bin/bash
# docker_diagnostic.sh - Диагностика Docker контейнеров медицинской системы

echo "🏥 Medical Monitoring System - Docker Diagnostics"
echo "=================================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для проверки статуса контейнера
check_container() {
    local container_name=$1
    local status=$(docker-compose ps -q $container_name 2>/dev/null)

    if [ -z "$status" ]; then
        echo -e "${RED}❌ $container_name: не найден${NC}"
        return 1
    fi

    local running=$(docker inspect --format="{{.State.Running}}" $(docker-compose ps -q $container_name) 2>/dev/null)
    local health=$(docker inspect --format="{{.State.Health.Status}}" $(docker-compose ps -q $container_name) 2>/dev/null)

    if [ "$running" = "true" ]; then
        if [ "$health" = "healthy" ] || [ "$health" = "" ]; then
            echo -e "${GREEN}✅ $container_name: работает${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  $container_name: работает, но не healthy ($health)${NC}"
            return 2
        fi
    else
        echo -e "${RED}❌ $container_name: остановлен${NC}"
        return 1
    fi
}

# Функция для проверки порта
check_port() {
    local port=$1
    local service=$2

    if nc -z localhost $port 2>/dev/null; then
        echo -e "${GREEN}✅ $service (port $port): доступен${NC}"
        return 0
    else
        echo -e "${RED}❌ $service (port $port): недоступен${NC}"
        return 1
    fi
}

echo "🔍 Проверка статуса контейнеров..."
echo ""

# Основные контейнеры
containers=("postgres" "redis" "backend" "grafana" "airflow-webserver" "airflow-scheduler" "postgres-airflow")
failed_containers=()

for container in "${containers[@]}"; do
    if ! check_container "$container"; then
        failed_containers+=("$container")
    fi
done

echo ""
echo "🌐 Проверка доступности портов..."
echo ""

# Проверка портов
ports=(
    "5432:PostgreSQL"
    "6379:Redis"
    "8045:Backend API"
    "3005:Grafana"
    "8080:Airflow"
)

failed_ports=()

for port_service in "${ports[@]}"; do
    IFS=':' read -r port service <<< "$port_service"
    if ! check_port "$port" "$service"; then
        failed_ports+=("$port:$service")
    fi
done

echo ""
echo "📊 Сводка диагностики:"
echo "====================="

if [ ${#failed_containers[@]} -eq 0 ] && [ ${#failed_ports[@]} -eq 0 ]; then
    echo -e "${GREEN}🎉 Все сервисы работают нормально!${NC}"
    echo ""
    echo "📝 Доступные сервисы:"
    echo "  • Backend API: http://localhost:8045/api/v1/docs"
    echo "  • Grafana: http://localhost:3005 (admin/admin)"
    echo "  • Airflow: http://localhost:8080 (admin/admin)"
    echo ""
    echo "🚀 Можете запустить генератор данных:"
    echo "  python test_data_generator.py"
else
    echo -e "${RED}⚠️  Обнаружены проблемы:${NC}"

    if [ ${#failed_containers[@]} -gt 0 ]; then
        echo ""
        echo -e "${RED}❌ Проблемные контейнеры:${NC}"
        for container in "${failed_containers[@]}"; do
            echo "  • $container"
        done
    fi

    if [ ${#failed_ports[@]} -gt 0 ]; then
        echo ""
        echo -e "${RED}❌ Недоступные порты:${NC}"
        for port_service in "${failed_ports[@]}"; do
            IFS=':' read -r port service <<< "$port_service"
            echo "  • $service (port $port)"
        done
    fi

    echo ""
    echo "🔧 Рекомендуемые действия:"
    echo ""

    # Специфичные рекомендации
    if [[ " ${failed_containers[@]} " =~ " postgres " ]]; then
        echo "📂 PostgreSQL проблемы:"
        echo "  docker-compose logs postgres"
        echo "  docker-compose restart postgres"
        echo ""
    fi

    if [[ " ${failed_containers[@]} " =~ " backend " ]]; then
        echo "🔧 Backend API проблемы:"
        echo "  docker-compose logs backend"
        echo "  docker-compose restart backend"
        echo ""
    fi

    if [[ " ${failed_containers[@]} " =~ " redis " ]]; then
        echo "💾 Redis проблемы:"
        echo "  docker-compose logs redis"
        echo "  docker-compose restart redis"
        echo ""
    fi

    echo "🔄 Общие команды для исправления:"
    echo "  # Перезапуск всех сервисов"
    echo "  docker-compose down && docker-compose up -d"
    echo ""
    echo "  # Просмотр логов всех сервисов"
    echo "  docker-compose logs -f"
    echo ""
    echo "  # Проверка статуса"
    echo "  docker-compose ps"
fi

echo ""
echo "📋 Дополнительная информация:"
echo ""

# Информация о дисковом пространстве
echo "💾 Использование диска Docker:"
docker system df 2>/dev/null | head -5

echo ""
echo "🔍 Последние логи backend (последние 10 строк):"
echo "=============================================="
docker-compose logs --tail=10 backend 2>/dev/null | tail -10

echo ""
echo "📊 Статус всех контейнеров:"
echo "========================="
docker-compose ps

echo ""
echo "🏁 Диагностика завершена"
echo ""
echo "💡 Если проблемы продолжаются:"
echo "  1. Проверьте docker-compose.yml"
echo "  2. Убедитесь что порты не заняты другими процессами"
echo "  3. Проверьте доступное место на диске"
echo "  4. Попробуйте полный перезапуск: docker-compose down -v && docker-compose up -d"