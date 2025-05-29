// Замените ваш components/Dashboard/Dashboard.jsx на этот код:

import React, { useState, useEffect, useRef } from 'react'
import { Activity, Heart, Droplets, Thermometer, AlertCircle, Wifi, WifiOff } from 'lucide-react'
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
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      const wsUrl = `${protocol}//${host}/ws/${userId}?token=${token}`

      console.log('WebSocket: Connecting to:', {
        userId,
        protocol,
        host,
        hasToken: !!token,
        url: wsUrl.replace(/token=[^&]+/, 'token=***')
      })

      ws.current = new WebSocket(wsUrl)

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

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('WebSocket: Message received:', message)
          handleWebSocketMessage(message)
        } catch (e) {
          console.error('WebSocket: Failed to parse message:', e, event.data)
        }
      }
    } catch (error) {
      console.error('WebSocket: Failed to connect:', error)
      setIsConnected(false)
    }
  }

  const handleWebSocketMessage = (message) => {
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

      // Load dashboard data
      const dashboardData = await api.getVitalsDashboard()
      console.log('Dashboard: Received data:', dashboardData)

      if (dashboardData.latest) {
        const latest = {}
        Object.entries(dashboardData.latest).forEach(([key, value]) => {
          latest[key] = value.value || value
        })
        setVitals(latest)
      }

      // Load alerts
      const alertsData = await api.getAlerts(5)
      setAlerts(alertsData.alerts || [])

    } catch (error) {
      console.error('Dashboard: Failed to load data:', error)

      if (error.message.includes('403') || error.message.includes('401')) {
        console.log('Dashboard: Auth error, logging out')
        onLogout()
        return
      }

      setError('Не удалось загрузить данные. Проверьте подключение к серверу.')

      // Set placeholder data when API fails
      setVitals({
        heart_rate: null,
        spo2: null,
        temperature: null,
        blood_pressure: null
      })
      setAlerts([])
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
    const timestamp = new Date().toLocaleTimeString()
    setChartData(prev => {
      const newData = [...prev, { time: timestamp, ...data }]
      return newData.slice(-20) // Keep last 20 points
    })
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

  // Показываем загрузку только если у нас есть пользователь
  if (isLoading && user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Загрузка данных...</span>
      </div>
    )
  }

  // Если нет пользователя, ничего не показываем (App.jsx должен перенаправить на Login)
  if (!user) {
    console.log('Dashboard: No user, should redirect to login')
    return null
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Мониторинг здоровья</h1>
          <p className="text-gray-600 mt-1">
            Реальное время • {user?.full_name || user?.fullName || user?.email || 'Пользователь'} • ID: {user?.id || 'N/A'}
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
            <div>Last Update: {new Date().toLocaleTimeString()}</div>
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

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-900">Важные уведомления</h3>
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
          loading={!vitals.heart_rate && !error}
        />

        <MetricCard
          title="Сатурация"
          value={vitals.spo2 || '--'}
          suffix="%"
          icon={Droplets}
          color="blue"
          loading={!vitals.spo2 && !error}
        />

        <MetricCard
          title="Температура"
          value={vitals.temperature || '--'}
          suffix="°C"
          icon={Thermometer}
          color="yellow"
          loading={!vitals.temperature && !error}
        />

        <MetricCard
          title="Давление"
          value={vitals.blood_pressure || '--'}
          suffix="мм рт.ст."
          icon={Activity}
          color="purple"
          loading={!vitals.blood_pressure && !error}
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
                />
                <Line
                  type="monotone"
                  dataKey="spo2"
                  stroke="#3B82F6"
                  name="SpO2"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Device Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Статус устройств</h3>
        {!user?.devices || user.devices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Устройства не подключены</p>
            <p className="text-sm">Обратитесь к администратору для настройки</p>
          </div>
        ) : (
          <div className="space-y-2">
            {user.devices.map(device => (
              <div key={device.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">{device.name}</span>
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
    </div>
  )
}

export default Dashboard