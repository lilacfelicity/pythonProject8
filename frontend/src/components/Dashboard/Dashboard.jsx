import React, { useState, useEffect, useRef } from 'react'
import { Activity, Heart, Droplets, Thermometer, AlertCircle, Wifi, WifiOff, TrendingUp, TrendingDown } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import MetricCard from './MetricCard'
import api from '../../services/api'

const Dashboard = ({ user, onLogout }) => {
  console.log('Dashboard: component mounted with user:', user)

  const [vitals, setVitals] = useState({
    heart_rate: null,
    spo2: null,
    temperature: null,
    blood_pressure: null
  })
  const [chartData, setChartData] = useState([])
  const [alerts, setAlerts] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [deviceStatus, setDeviceStatus] = useState([])

  // WebSocket reference
  const ws = useRef(null)
  const reconnectTimeout = useRef(null)
  const reconnectAttempts = useRef(0)

  // Проверяем что у нас есть пользователь и токен
  useEffect(() => {
    console.log('Dashboard: checking auth state')
    console.log('User:', user)
    console.log('Token:', api.getAccessToken() ? 'Present' : 'Missing')

    if (!user || !user.id) {
      console.error('Dashboard: No user or user.id, redirecting to login')
      onLogout()
      return
    }

    if (!api.getAccessToken()) {
      console.error('Dashboard: No access token, redirecting to login')
      onLogout()
      return
    }

    console.log('Dashboard: Auth check passed, loading data')
    loadDashboardData()
  }, [user, onLogout])

  // Настройка WebSocket после авторизации
  useEffect(() => {
    if (user && user.id && api.getAccessToken()) {
      console.log('Dashboard: Setting up WebSocket for user ID:', user.id)
      connectWebSocket()
    }

    return () => {
      if (ws.current) {
        console.log('Dashboard: Cleaning up WebSocket')
        ws.current.close()
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }
    }
  }, [user])

  const connectWebSocket = () => {
    const userId = user.id || user.user_id
    const token = api.getAccessToken()

    if (!userId) {
      console.error('WebSocket: Cannot connect - missing user ID')
      return
    }

    if (!token) {
      console.error('WebSocket: Cannot connect - missing access token')
      return
    }

    try {
      ws.current = api.connectWebSocket(userId, handleWebSocketMessage)

      if (ws.current) {
        ws.current.onopen = () => {
          console.log('WebSocket: Connected successfully')
          setIsConnected(true)
          reconnectAttempts.current = 0
        }

        ws.current.onclose = (event) => {
          console.log('WebSocket: Disconnected:', { code: event.code, reason: event.reason })
          setIsConnected(false)

          // Reconnect logic
          if (reconnectAttempts.current < 5) {
            const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
            console.log(`WebSocket: Reconnecting in ${timeout}ms (attempt ${reconnectAttempts.current + 1}/5)`)
            reconnectTimeout.current = setTimeout(() => {
              reconnectAttempts.current++
              connectWebSocket()
            }, timeout)
          }
        }

        ws.current.onerror = (error) => {
          console.error('WebSocket: Error occurred:', error)
          setIsConnected(false)
        }
      }
    } catch (error) {
      console.error('WebSocket: Failed to connect:', error)
      setIsConnected(false)
    }
  }

  const handleWebSocketMessage = (message) => {
    console.log('Dashboard: WebSocket message received:', message)
    if (message.type === 'vital_update') {
      updateVitals(message.data)
    } else if (message.type === 'alert') {
      addAlert(message.data)
    }
  }

  const loadDashboardData = async () => {
    console.log('Dashboard: Loading data...')
    setIsLoading(true)
    setError(null)

    try {
      // Проверяем токен перед запросом
      const token = api.getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      console.log('Dashboard: Making API request with token:', token ? 'Present' : 'Missing')

      // Загружаем данные параллельно
      const [dashboardResult, alertsResult, devicesResult] = await Promise.allSettled([
        api.getVitalsDashboard(),
        api.getAlerts(5),
        api.getDevices()
      ])

      // Обрабатываем дашборд данные
      if (dashboardResult.status === 'fulfilled') {
        const dashboardData = dashboardResult.value
        console.log('Dashboard: Received data:', dashboardData)

        if (dashboardData.latest) {
          const normalizedVitals = {}
          Object.entries(dashboardData.latest).forEach(([key, value]) => {
            if (typeof value === 'object' && value.value !== undefined) {
              normalizedVitals[key] = value.value
            } else {
              normalizedVitals[key] = value
            }
          })
          setVitals(normalizedVitals)
          setLastUpdate(new Date().toLocaleTimeString('ru-RU'))
        } else {
          // Если нет данных, устанавливаем null значения
          setVitals({
            heart_rate: null,
            spo2: null,
            temperature: null,
            blood_pressure: null
          })
        }

        // Set chart data
        if (dashboardData.chart_data && dashboardData.chart_data.length > 0) {
          setChartData(dashboardData.chart_data)
        } else {
          setChartData([])
        }
      } else {
        console.warn('Dashboard: Failed to load vitals dashboard:', dashboardResult.reason)
        setVitals({
          heart_rate: null,
          spo2: null,
          temperature: null,
          blood_pressure: null
        })
        setChartData([])
      }

      // Обрабатываем алерты
      if (alertsResult.status === 'fulfilled') {
        setAlerts(alertsResult.value.alerts || [])
      } else {
        console.warn('Dashboard: Failed to load alerts:', alertsResult.reason)
        setAlerts([])
      }

      // Обрабатываем устройства
      if (devicesResult.status === 'fulfilled') {
        const devices = Array.isArray(devicesResult.value) ? devicesResult.value :
                       (devicesResult.value?.devices || [])
        setDeviceStatus(devices)
      } else {
        console.warn('Dashboard: Failed to load devices:', devicesResult.reason)
        setDeviceStatus([])
      }

      // Если все запросы провалились, показываем ошибку
      if (dashboardResult.status === 'rejected' &&
          alertsResult.status === 'rejected' &&
          devicesResult.status === 'rejected') {
        throw new Error('Не удалось загрузить данные со всех источников')
      }

    } catch (error) {
      console.error('Dashboard: Failed to load data:', error)

      if (error.message.includes('403') ||
          error.message.includes('401') ||
          error.message.includes('Authentication failed')) {
        console.log('Dashboard: Auth error, logging out')
        onLogout()
        return
      }

      setError('Не удалось загрузить некоторые данные. Проверьте подключение к серверу.')

      // НЕ устанавливаем fallback данные - показываем реальное состояние
      setVitals({
        heart_rate: null,
        spo2: null,
        temperature: null,
        blood_pressure: null
      })
      setChartData([])
      setAlerts([])
      setDeviceStatus([])
    } finally {
      setIsLoading(false)
    }
  }

  const updateVitals = (data) => {
    console.log('Dashboard: Updating vitals:', data)
    setVitals(prev => ({
      ...prev,
      ...data
    }))

    // Update chart data
    const timestamp = new Date().toLocaleTimeString('ru-RU')
    setChartData(prev => {
      const newData = [...prev, { time: timestamp, ...data }]
      return newData.slice(-20) // Keep last 20 points
    })

    setLastUpdate(new Date().toLocaleTimeString('ru-RU'))
  }

  const addAlert = (alert) => {
    console.log('Dashboard: Adding alert:', alert)
    setAlerts(prev => [alert, ...prev].slice(0, 5))
  }

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-blue-600 bg-blue-50'
    }
  }

  const handleLogout = async () => {
    console.log('Dashboard: Handling logout')
    try {
      await api.logout()
    } catch (error) {
      console.error('Dashboard: Logout error:', error)
    } finally {
      onLogout()
    }
  }

  const getVitalTrend = (vitalType) => {
    if (chartData.length < 2) return null

    const current = chartData[chartData.length - 1]?.[vitalType]
    const previous = chartData[chartData.length - 2]?.[vitalType]

    if (current && previous) {
      const change = ((current - previous) / previous * 100).toFixed(1)
      return {
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
        value: Math.abs(change)
      }
    }
    return null
  }

  // Проверяем есть ли какие-то данные для отображения
  const hasAnyData = () => {
    return Object.values(vitals).some(v => v !== null) ||
           chartData.length > 0 ||
           deviceStatus.length > 0
  }

  // Показываем загрузку только если у нас есть пользователь
  if (isLoading && user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Загрузка данных мониторинга...</span>
      </div>
    )
  }

  // Если нет пользователя, ничего не показываем (App.jsx должен перенаправить на Login)
  if (!user) {
    console.log('Dashboard: No user, should redirect to login')
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Мониторинг здоровья</h1>
          <p className="text-gray-600 mt-1">
            {lastUpdate ? `Обновлено: ${lastUpdate}` : 'Загрузка данных...'} • {user?.full_name || user?.fullName || user?.email || 'Пользователь'} • ID: {user?.id || 'N/A'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center text-green-600">
                <Wifi className="h-5 w-5 mr-1" />
                <span className="text-sm">Подключено</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <WifiOff className="h-5 w-5 mr-1" />
                <span className="text-sm">Нет связи</span>
              </div>
            )}
          </div>

          <button
            onClick={loadDashboardData}
            disabled={isLoading}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Обновление...' : 'Обновить'}
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Debug Info - показываем в development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Debug Info</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <div>User ID: {user?.id || 'N/A'}</div>
            <div>User Email: {user?.email || 'N/A'}</div>
            <div>Full Name: {user?.full_name || user?.fullName || 'N/A'}</div>
            <div>Access Token: {api.getAccessToken() ? 'Present' : 'Missing'}</div>
            <div>Token Value: {api.getAccessToken()?.substring(0, 20) + '...' || 'N/A'}</div>
            <div>WebSocket: {isConnected ? 'Connected' : 'Disconnected'}</div>
            <div>Reconnect Attempts: {reconnectAttempts.current}</div>
            <div>Last Update: {lastUpdate || 'Never'}</div>
            <div>Has Data: {hasAnyData() ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-900">Ошибка загрузки</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={loadDashboardData}
                className="text-sm text-red-600 hover:text-red-800 mt-2 underline"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Data Message */}
      {!isLoading && !error && !hasAnyData() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="text-center">
            <Activity className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-blue-900 mb-2">Нет данных мониторинга</h3>
            <p className="text-blue-700 mb-4">
              В системе пока нет данных для пользователя {user?.email}.
              Данные появятся после подключения медицинских устройств IoT.
            </p>
            <div className="text-sm text-blue-600">
              <p>Для начала мониторинга:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Обратитесь к администратору для настройки устройств</li>
                <li>Убедитесь что устройства подключены к сети</li>
                <li>Проверьте корректность передачи данных</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-orange-900">Важные уведомления</h3>
              <div className="mt-2 space-y-1">
                {alerts.map((alert, idx) => (
                  <div key={idx} className={`text-sm p-2 rounded ${getAlertColor(alert.type)}`}>
                    {alert.message || 'Новое уведомление'}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vitals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Пульс"
          value={vitals.heart_rate || '--'}
          suffix="уд/мин"
          icon={Heart}
          color="red"
          loading={!vitals.heart_rate && isLoading}
          trend={getVitalTrend('heart_rate')}
        />

        <MetricCard
          title="Сатурация"
          value={vitals.spo2 || '--'}
          suffix="%"
          icon={Droplets}
          color="blue"
          loading={!vitals.spo2 && isLoading}
          trend={getVitalTrend('spo2')}
        />

        <MetricCard
          title="Температура"
          value={vitals.temperature || '--'}
          suffix="°C"
          icon={Thermometer}
          color="yellow"
          loading={!vitals.temperature && isLoading}
          trend={getVitalTrend('temperature')}
        />

        <MetricCard
          title="Давление"
          value={vitals.blood_pressure || '--'}
          suffix="мм рт.ст."
          icon={Activity}
          color="purple"
          loading={!vitals.blood_pressure && isLoading}
        />
      </div>

      {/* Real-time Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Динамика показателей</h3>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="heart_rate"
                  stroke="#EF4444"
                  name="Пульс"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="spo2"
                  stroke="#3B82F6"
                  name="SpO2"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#F59E0B"
                  name="Температура"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Device Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Статус устройств</h3>
        {deviceStatus.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Устройства не подключены</p>
            <p className="text-sm">Обратитесь к администратору для настройки</p>
          </div>
        ) : (
          <div className="space-y-2">
            {deviceStatus.map(device => (
              <div key={device.id || device.device_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">{device.name || device.device_name}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  device.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {device.status === 'active' ? 'Активно' : 'Неактивно'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-blue-900">Сегодня измерений</h4>
              <p className="text-2xl font-bold text-blue-600">{chartData.length}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-green-900">Статус подключения</h4>
              <p className="text-lg font-semibold text-green-600">
                {isConnected ? 'Подключено' : 'Отключено'}
              </p>
            </div>
            {isConnected ? (
              <Wifi className="h-8 w-8 text-green-500" />
            ) : (
              <WifiOff className="h-8 w-8 text-red-500" />
            )}
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-purple-900">Последнее обновление</h4>
              <p className="text-lg font-semibold text-purple-600">
                {lastUpdate || 'Нет данных'}
              </p>
            </div>
            <Heart className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Быстрые действия</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={loadDashboardData}
            className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Activity className="h-6 w-6 text-blue-500 mb-1" />
            <span className="text-xs text-gray-600">Обновить данные</span>
          </button>

          <button className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Heart className="h-6 w-6 text-red-500 mb-1" />
            <span className="text-xs text-gray-600">История пульса</span>
          </button>

          <button className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Thermometer className="h-6 w-6 text-yellow-500 mb-1" />
            <span className="text-xs text-gray-600">Температурный лог</span>
          </button>

          <button className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <AlertCircle className="h-6 w-6 text-orange-500 mb-1" />
            <span className="text-xs text-gray-600">Все уведомления</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard