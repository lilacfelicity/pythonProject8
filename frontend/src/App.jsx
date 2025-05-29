// Замените ваш App.jsx на этот код:

import React, { useState, useEffect, Suspense } from 'react'
import Layout from './components/Layout/Layout.jsx'
import api from './services/api'

// Компоненты
import Dashboard from './components/Dashboard/Dashboard.jsx'
import MedicalHistory from './components/MedicalHistory.jsx'
import Profile from './components/Profile.jsx'
import Login from './components/Login.jsx'
import Welcome from './components/Welcome.jsx'
import Analytics from './components/Analytics.jsx'

// Компонент загрузки
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600">Загрузка...</span>
  </div>
)

// Главное приложение
function App() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard')

  // Проверка авторизации при загрузке приложения
  useEffect(() => {
    const checkAuth = async () => {
      console.log('App: Checking authentication...')

      try {
        // Проверяем есть ли токен и валиден ли он
        if (api.isAuthenticated()) {
          console.log('App: Token found, verifying...')

          // Пытаемся получить информацию о пользователе
          const userInfo = await api.getMe()
          console.log('App: User info received:', userInfo)

          // Нормализуем данные пользователя
          const normalizedUser = {
            id: userInfo.id || userInfo.user_id,
            email: userInfo.email,
            username: userInfo.username,
            full_name: userInfo.full_name || userInfo.fullName,
            fullName: userInfo.full_name || userInfo.fullName,
            first_name: userInfo.first_name,
            last_name: userInfo.last_name,
            profile: userInfo.profile || {},
            devices: userInfo.devices || [],
            ...userInfo
          }

          console.log('App: Normalized user data:', normalizedUser)

          // Проверяем что у пользователя есть ID
          if (!normalizedUser.id) {
            console.error('App: User data is missing ID field:', normalizedUser)
            throw new Error('User data is incomplete - missing ID')
          }

          setUser(normalizedUser)

          // Сохраняем пользователя в localStorage для восстановления сессии
          localStorage.setItem('medmonitor_user', JSON.stringify(normalizedUser))

          // Проверяем первый ли это визит
          const isFirstVisit = localStorage.getItem('medmonitor_first_visit')
          if (!isFirstVisit) {
            console.log('App: First visit detected, showing welcome')
            setShowWelcome(true)
          }
        } else {
          console.log('App: No valid token found')
          // Токена нет или он невалиден, проверяем localStorage
          const savedUser = localStorage.getItem('medmonitor_user')
          if (savedUser) {
            console.log('App: Clearing stale user data')
            // Очищаем устаревшие данные
            localStorage.removeItem('medmonitor_user')
            localStorage.removeItem('medmonitor_first_visit')
          }
        }
      } catch (error) {
        console.error('App: Auth check failed:', error)
        // В случае ошибки очищаем все данные
        handleLogout()
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Обработка входа в систему
  const handleLogin = async (userData) => {
    try {
      console.log('App: User logged in:', userData)

      // Нормализуем данные пользователя
      const normalizedUser = {
        id: userData.id || userData.user_id || userData.user?.id,
        email: userData.email || userData.user?.email,
        username: userData.username || userData.user?.username,
        full_name: userData.full_name || userData.fullName || userData.user?.full_name,
        fullName: userData.full_name || userData.fullName || userData.user?.full_name,
        first_name: userData.first_name || userData.user?.first_name,
        last_name: userData.last_name || userData.user?.last_name,
        profile: userData.profile || userData.user?.profile || {},
        devices: userData.devices || userData.user?.devices || [],
        ...userData
      }

      console.log('App: Setting normalized user data:', normalizedUser)

      // Проверяем что у пользователя есть ID
      if (!normalizedUser.id) {
        console.error('App: Login - User data is missing ID field:', normalizedUser)
        throw new Error('User data is incomplete - missing ID')
      }

      setUser(normalizedUser)

      // Сохраняем пользователя в localStorage
      localStorage.setItem('medmonitor_user', JSON.stringify(normalizedUser))

      // Проверяем первый ли это визит
      const isFirstVisit = localStorage.getItem('medmonitor_first_visit')
      if (!isFirstVisit) {
        console.log('App: First login, showing welcome')
        setShowWelcome(true)
      }

    } catch (error) {
      console.error('App: Login error:', error)
      throw error
    }
  }

  // Обработка выхода из системы
  const handleLogout = async () => {
    console.log('App: Logging out...')

    try {
      // Отправляем запрос на выход (опционально)
      await api.logout()
    } catch (error) {
      console.warn('App: Logout request failed:', error)
    } finally {
      // Очищаем локальное состояние
      setUser(null)
      setShowWelcome(false)
      setCurrentView('dashboard')

      // Очищаем localStorage
      localStorage.removeItem('medmonitor_user')
      localStorage.removeItem('medmonitor_first_visit')

      console.log('App: Logout completed')
    }
  }

  // Завершение приветственного экрана
  const handleWelcomeComplete = () => {
    console.log('App: Welcome completed')
    setShowWelcome(false)
    localStorage.setItem('medmonitor_first_visit', 'true')
  }

  // Автоматическая проверка токена каждые 5 минут
  useEffect(() => {
    if (!user) return

    const interval = setInterval(async () => {
      try {
        const isValid = await api.checkAuthStatus()
        if (!isValid) {
          console.warn('App: Token expired, logging out')
          handleLogout()
        }
      } catch (error) {
        console.error('App: Token check failed:', error)
        handleLogout()
      }
    }, 5 * 60 * 1000) // 5 минут

    return () => clearInterval(interval)
  }, [user])

  // Показываем экран загрузки
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">MedMonitor</h2>
          <p className="text-gray-600">Инициализация системы медицинского мониторинга...</p>
          <div className="mt-4 text-sm text-gray-500">
            Проверка авторизации...
          </div>
        </div>
      </div>
    )
  }

  // Показываем приветственный экран для новых пользователей
  if (showWelcome && user) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Welcome
          user={user}
          onContinue={handleWelcomeComplete}
        />
      </Suspense>
    )
  }

  // Показываем логин если пользователь не авторизован
  if (!user) {
    console.log('App: No user, showing login')
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Login onLogin={handleLogin} />
      </Suspense>
    )
  }

  // Основное приложение для авторизованных пользователей
  const renderCurrentView = () => {
    console.log('App: Rendering view:', currentView, 'for user:', user.id)

    switch (currentView) {
      case 'dashboard':
        return <Dashboard user={user} onLogout={handleLogout} />
      case 'main':
        return <MainPage user={user} />
      case 'profile':
        return <Profile user={user} />
      case 'history':
        return <MedicalHistory user={user} />
      case 'analytics':
        return <Analytics user={user} />
      case 'devices':
        return <DevicesPage user={user} />
      case 'settings':
        return <SettingsPage user={user} />
      default:
        return <Dashboard user={user} onLogout={handleLogout} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Layout user={user} onLogout={handleLogout} currentView={currentView} onViewChange={setCurrentView}>
        <Suspense fallback={<LoadingSpinner />}>
          {renderCurrentView()}
        </Suspense>
      </Layout>
    </div>
  )
}

// Главная страница с placeholder'ами
const MainPage = ({ user }) => {
  const [stats, setStats] = useState({
    totalTests: '--',
    lastTestDate: '--',
    abnormalValues: '--',
    normalValues: '--'
  })

  useEffect(() => {
    // Загружаем статистику с API
    const loadStats = async () => {
      try {
        const analyticsData = await api.getAnalyticsSummary(365) // За год
        setStats({
          totalTests: analyticsData.total_readings || '--',
          lastTestDate: analyticsData.last_reading_date || '--',
          abnormalValues: analyticsData.anomalies_count || '--',
          normalValues: (analyticsData.total_readings - analyticsData.anomalies_count) || '--'
        })
      } catch (error) {
        console.error('MainPage: Failed to load stats:', error)
        // Оставляем placeholder'ы
      }
    }

    loadStats()
  }, [])

  return (
    <div className="space-y-6">
      {/* Заголовок с приветствием */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Добро пожаловать, {user?.full_name?.split(' ')[1] || user?.username || 'Пользователь'}!
            </h1>
            <p className="text-blue-100 text-lg">
              Сегодня {new Date().toLocaleDateString('ru-RU', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Компактная статистика здоровья */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthStatCard
          title="Последний анализ"
          value={stats.lastTestDate}
          subtitle="Данные из системы"
          icon="🩸"
          color="bg-red-50 border-red-200"
        />
        <HealthStatCard
          title="Всего анализов"
          value={stats.totalTests}
          subtitle="За весь период"
          icon="📊"
          color="bg-blue-50 border-blue-200"
        />
        <HealthStatCard
          title="Отклонения"
          value={stats.abnormalValues}
          subtitle="Требуют внимания"
          icon="⚠️"
          color="bg-yellow-50 border-yellow-200"
        />
        <HealthStatCard
          title="В норме"
          value={stats.normalValues}
          subtitle="Показатели в порядке"
          icon="✅"
          color="bg-green-50 border-green-200"
        />
      </div>

      {/* Компактный профиль */}
      <Profile user={user} compact={true} />

      {/* Последние активности */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Последние активности</h2>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📋</div>
          <p>История активности будет отображаться здесь</p>
          <p className="text-sm">после получения данных с медицинских устройств</p>
        </div>
      </div>
    </div>
  )
}

// Компонент карточки статистики здоровья
const HealthStatCard = ({ title, value, subtitle, icon, color }) => {
  return (
    <div className={`p-4 border rounded-xl ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-2xl">{icon}</div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-600">{title}</div>
        </div>
      </div>
      <div className="text-sm text-gray-600">{subtitle}</div>
    </div>
  )
}

// Остальные страницы с placeholder'ами
const DevicesPage = ({ user }) => {
  const [devices, setDevices] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devicesData = await api.getDevices()
        setDevices(devicesData)
      } catch (error) {
        console.error('DevicesPage: Failed to load devices:', error)
        setDevices([])
      } finally {
        setIsLoading(false)
      }
    }

    loadDevices()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Мониторинг устройств</h1>
        <p className="text-gray-600 mt-1">Управление IoT устройствами для медицинского мониторинга</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Подключенные устройства</h2>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Загрузка устройств...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📱</div>
            <p>Устройства не подключены</p>
            <p className="text-sm">Обратитесь к администратору для настройки устройств</p>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <div key={device.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">{device.name}</h3>
                  <p className="text-sm text-gray-500">ID: {device.device_id}</p>
                </div>
                <span className={`px-3 py-1 text-sm rounded-full ${
                  device.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
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

const SettingsPage = ({ user }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Настройки</h1>
        <p className="text-gray-600 mt-1">Управление системой и профилем пользователя</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Настройки профиля</h2>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">⚙️</div>
          <p>Настройки системы</p>
          <p className="text-sm">Страница находится в разработке</p>
        </div>
      </div>
    </div>
  )
}

export default App