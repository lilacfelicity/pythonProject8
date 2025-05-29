import React, { useState, useEffect, useRef } from 'react'
import { Activity, Heart, Droplets, Thermometer, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { useWebSocket } from '../../hooks/useWebSocket'
import MetricCard from './MetricCard'
import api from '../../services/api'

const Dashboard = ({ user }) => {
  const [vitals, setVitals] = useState({
    heart_rate: null,
    spo2: null,
    temperature: null,
    blood_pressure: null
  })
  const [chartData, setChartData] = useState([])
  const [alerts, setAlerts] = useState([])
  const [isConnected, setIsConnected] = useState(false)

  const { sendMessage, lastMessage, readyState } = useWebSocket(
    `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/${user?.id || 'default'}`
  )

  // Load initial data
  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const message = JSON.parse(lastMessage.data)

        if (message.type === 'vital_update') {
          updateVitals(message.data)
        } else if (message.type === 'alert') {
          addAlert(message.data)
        }
      } catch (e) {
        console.error('Failed to parse message:', e)
      }
    }
  }, [lastMessage])

  // Update connection status
  useEffect(() => {
    setIsConnected(readyState === WebSocket.OPEN)
  }, [readyState])

  const fetchDashboardData = async () => {
    try {
      const data = await api.getVitalsDashboard()

      // Update latest vitals
      if (data.latest) {
        const latest = {}
        Object.entries(data.latest).forEach(([key, value]) => {
          latest[key] = value.value
        })
        setVitals(latest)
      }

      // Update alerts
      if (data.alerts) {
        fetchAlerts()
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    }
  }

  const fetchAlerts = async () => {
    try {
      const data = await api.getAlerts(5)
      setAlerts(data.alerts)
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    }
  }

  const updateVitals = (data) => {
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
    setAlerts(prev => [alert, ...prev].slice(0, 5))
  }

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-blue-600 bg-blue-50'
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Мониторинг здоровья</h1>
          <p className="text-gray-600 mt-1">Реальное время • {user?.fullName}</p>
        </div>

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
      </div>

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
                    {alert.message}
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
          loading={!vitals.heart_rate}
        />

        <MetricCard
          title="Сатурация"
          value={vitals.spo2 || '--'}
          suffix="%"
          icon={Droplets}
          color="blue"
          loading={!vitals.spo2}
        />

        <MetricCard
          title="Температура"
          value={vitals.temperature || '--'}
          suffix="°C"
          icon={Thermometer}
          color="yellow"
          loading={!vitals.temperature}
        />

        <MetricCard
          title="Давление"
          value={vitals.blood_pressure || '--'}
          suffix="мм рт.ст."
          icon={Activity}
          color="purple"
          loading={!vitals.blood_pressure}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Устройства</h3>
          <div className="space-y-2">
            {user?.devices?.map(device => (
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
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Статистика за 24ч</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Измерений</span>
              <span className="text-sm font-medium">248</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Средний пульс</span>
              <span className="text-sm font-medium">72 уд/мин</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Аномалий</span>
              <span className="text-sm font-medium text-red-600">3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard