import React, { useState, useEffect, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout/Layout.jsx'

// Импорт компонентов
import Dashboard from './components/Dashboard/Dashboard.jsx'
import MedicalHistory from './components/MedicalHistory.jsx'
import Profile from './components/Profile.jsx'
import Login from './components/Login.jsx'
import Welcome from './components/Welcome.jsx'
import Analytics from './components/Analytics.jsx'

// Тестовые данные пользователя (исправлены для соответствия Analytics)
const testUser = {
  id: 1,
  fullName: "Петрова Ирина Сергеевна",
  email: "irina.petrova@email.com",
  birthDate: "15.08.2001",
  age: 23,
  gender: "female",
  role: "patient",
  profile: {
    firstName: "Ирина",
    lastName: "Петрова",
    patronymic: "Сергеевна",
    phone: "+7 (999) 123-45-67",
    bloodType: "A(II) Rh+",
    height: 168,
    weight: 62,
    allergies: "Поллиноз (пыльца березы, полынь)",
    chronicConditions: "Гастрит неинфекционной этиологии",
    emergencyContact: "Мама: +7 (999) 987-65-43"
  },
  devices: [
    { id: 1, name: "Пульсоксиметр", deviceId: "PULSE_001", status: "active", lastSeen: new Date() },
    { id: 2, name: "Тонометр", deviceId: "BP_001", status: "active", lastSeen: new Date() },
    { id: 3, name: "Глюкометр", deviceId: "GLUC_001", status: "active", lastSeen: new Date() }
  ],
  medicalHistory: [
    { date: "25.05.2025", doctor: "Сидорова Анна Владимировна", diagnosis: "Плановый осмотр, анализы", status: "completed" },
    { date: "20.04.2025", doctor: "Иванова Елена Петровна", diagnosis: "Гормональное обследование", status: "completed" },
    { date: "15.03.2025", doctor: "Петрова Наталья Ивановна", diagnosis: "Контроль витаминов", status: "completed" },
    { date: "28.02.2025", doctor: "Сидорова Анна Владимировна", diagnosis: "Гастроскопия, H.pylori тест", status: "completed" },
    { date: "20.01.2025", doctor: "Козлова Мария Александровна", diagnosis: "Аллергопанель", status: "completed" }
  ],
  medications: [
    { name: "Омепразол", dosage: "20мг", frequency: "1 раз в день утром", startDate: "01.03.2025", endDate: null, status: "active" },
    { name: "Колекальциферол (Витамин D3)", dosage: "2000 МЕ", frequency: "1 раз в день", startDate: "15.03.2025", endDate: null, status: "active" },
    { name: "Лоратадин", dosage: "10мг", frequency: "По необходимости (сезон)", startDate: "01.04.2025", endDate: "30.09.2025", status: "seasonal" },
    { name: "Фолиевая кислота", dosage: "5мг", frequency: "1 раз в день", startDate: "10.02.2025", endDate: "10.05.2025", status: "completed" }
  ],
  // Данные для аналитики
  laboratoryData: {
    totalTests: 24,
    lastTestDate: "2025-05-25",
    abnormalValues: 2,
    normalValues: 22,
    criticalAlerts: 0,
    pendingResults: 0
  }
}

// Компонент загрузки
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600">Загрузка...</span>
  </div>
)

// Защищенный роут
const ProtectedRoute = ({ children, user }) => {
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

// Главное приложение
function App() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)

  // Проверка сохраненного состояния авторизации при загрузке
  useEffect(() => {
    const checkAuthState = () => {
      try {
        const savedUser = localStorage.getItem('medmonitor_user')
        const isFirstVisit = localStorage.getItem('medmonitor_first_visit')

        if (savedUser) {
          const userData = JSON.parse(savedUser)
          setUser(userData)

          // Показываем приветственный экран для первого входа
          if (!isFirstVisit) {
            setShowWelcome(true)
          }
        }
      } catch (error) {
        console.error('Ошибка восстановления сессии:', error)
        // Очищаем поврежденные данные
        localStorage.removeItem('medmonitor_user')
        localStorage.removeItem('medmonitor_first_visit')
      } finally {
        setIsLoading(false)
      }
    }

    // Симуляция проверки авторизации
    setTimeout(checkAuthState, 1000)
  }, [])

  // Обработка входа в систему
  const handleLogin = (userData) => {
    // Используем расширенные тестовые данные
    const fullUserData = { ...testUser, ...userData }
    setUser(fullUserData)

    try {
      localStorage.setItem('medmonitor_user', JSON.stringify(fullUserData))
    } catch (error) {
      console.error('Ошибка сохранения данных пользователя:', error)
    }

    // Проверяем, первый ли это вход
    const isFirstVisit = localStorage.getItem('medmonitor_first_visit')
    if (!isFirstVisit) {
      setShowWelcome(true)
    }

    setIsLoading(false)
  }

  // Обработка выхода из системы
  const handleLogout = () => {
    setUser(null)
    setShowWelcome(false)
    localStorage.removeItem('medmonitor_user')
    localStorage.removeItem('medmonitor_first_visit')
  }

  // Завершение приветственного экрана
  const handleWelcomeComplete = () => {
    setShowWelcome(false)
    localStorage.setItem('medmonitor_first_visit', 'true')
  }

  // Показываем экран загрузки
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">MedMonitor</h2>
          <p className="text-gray-600">Загрузка системы медицинского мониторинга...</p>
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
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </Suspense>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Маршруты без аутентификации */}
        {!user ? (
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/login" element={
                <Login onLogin={handleLogin} />
              } />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        ) : (
          /* Основное приложение для авторизованных пользователей */
          <Layout user={user} onLogout={handleLogout}>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Главная страница - перенаправление на дашборд */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* Основные страницы */}
                <Route path="/dashboard" element={
                  <ProtectedRoute user={user}>
                    <Dashboard user={user} />
                  </ProtectedRoute>
                } />

                <Route path="/main" element={
                  <ProtectedRoute user={user}>
                    <MainPage user={user} />
                  </ProtectedRoute>
                } />

                <Route path="/profile" element={
                  <ProtectedRoute user={user}>
                    <Profile user={user} />
                  </ProtectedRoute>
                } />

                <Route path="/history" element={
                  <ProtectedRoute user={user}>
                    <MedicalHistory user={user} />
                  </ProtectedRoute>
                } />

                {/* Аналитика - полноценная страница */}
                <Route path="/analytics" element={
                  <ProtectedRoute user={user}>
                    <Analytics user={user} />
                  </ProtectedRoute>
                } />

                {/* Заглушки для остальных страниц */}
                <Route path="/patients" element={
                  <ProtectedRoute user={user}>
                    <ComingSoonPage title="Пациенты" />
                  </ProtectedRoute>
                } />

                <Route path="/devices" element={
                  <ProtectedRoute user={user}>
                    <DevicesPage user={user} />
                  </ProtectedRoute>
                } />

                <Route path="/settings" element={
                  <ProtectedRoute user={user}>
                    <SettingsPage user={user} />
                  </ProtectedRoute>
                } />

                {/* 404 страница */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </Layout>
        )}

        {/* Глобальные уведомления */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#10B981',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: '#EF4444',
              },
            },
          }}
        />
      </div>
    </Router>
  )
}

// Главная страница с профилем пациента
const MainPage = ({ user }) => {
  return (
    <div className="space-y-6">
      {/* Заголовок с приветствием */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Добро пожаловать, {user?.profile?.firstName || 'Ирина'}!
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
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7V9C15 11.8 12.8 14 10 14S5 11.8 5 9V7H3V9C3 12.9 6.1 16 10 16V18H12V16C15.9 16 19 12.9 19 9V7H21Z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Компактная статистика здоровья */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthStatCard
          title="Последний анализ"
          value="2 дня назад"
          subtitle="Кровь + биохимия"
          icon="🩸"
          color="bg-red-50 border-red-200"
        />
        <HealthStatCard
          title="Всего анализов"
          value={user?.laboratoryData?.totalTests || "24"}
          subtitle="За последний год"
          icon="📊"
          color="bg-blue-50 border-blue-200"
        />
        <HealthStatCard
          title="Отклонения"
          value={user?.laboratoryData?.abnormalValues || "2"}
          subtitle="Требуют внимания"
          icon="⚠️"
          color="bg-yellow-50 border-yellow-200"
        />
        <HealthStatCard
          title="В норме"
          value={user?.laboratoryData?.normalValues || "22"}
          subtitle="Показатели в порядке"
          icon="✅"
          color="bg-green-50 border-green-200"
        />
      </div>

      {/* Компактный профиль */}
      <Profile user={user} compact={true} />

      {/* Быстрые действия */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickActionCard
          title="Дашборд"
          description="Мониторинг в реальном времени"
          icon="📊"
          href="/dashboard"
          color="bg-blue-50 hover:bg-blue-100 border-blue-200"
        />
        <QuickActionCard
          title="Аналитика здоровья"
          description="Анализ лабораторных данных"
          icon="🔬"
          href="/analytics"
          color="bg-purple-50 hover:bg-purple-100 border-purple-200"
        />
        <QuickActionCard
          title="История болезни"
          description="Медицинские записи"
          icon="📋"
          href="/history"
          color="bg-green-50 hover:bg-green-100 border-green-200"
        />
        <QuickActionCard
          title="Устройства"
          description="IoT мониторинг"
          icon="📱"
          href="/devices"
          color="bg-orange-50 hover:bg-orange-100 border-orange-200"
        />
      </div>

      {/* Последние активности */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Последние активности</h2>
        <div className="space-y-4">
          <ActivityItem
            time="2 дня назад"
            action="Анализ крови"
            value="Гемоглобин 138 г/л, лейкоциты 5.8"
            status="normal"
          />
          <ActivityItem
            time="5 часов назад"
            action="Измерение давления"
            value="115/72 мм рт.ст."
            status="normal"
          />
          <ActivityItem
            time="6 часов назад"
            action="Пульс"
            value="76 уд/мин"
            status="normal"
          />
          <ActivityItem
            time="Вчера"
            action="Прием лекарства"
            value="Омепразол 20мг"
            status="completed"
          />
          <ActivityItem
            time="20 апреля"
            action="Гормональное обследование"
            value="ТТГ, Т4 свободный"
            status="completed"
          />
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

// Компонент карточки быстрого действия (исправлен для React Router)
const QuickActionCard = ({ title, description, icon, href, color }) => {
  return (
    <Link
      to={href}
      className={`block p-6 border rounded-xl transition-all duration-200 ${color}`}
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  )
}

// Компонент элемента активности
const ActivityItem = ({ time, action, value, status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'normal':
        return 'text-green-600 bg-green-50'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50'
      case 'critical':
        return 'text-red-600 bg-red-50'
      case 'completed':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'normal': return 'Норма'
      case 'warning': return 'Внимание'
      case 'critical': return 'Критично'
      case 'completed': return 'Выполнено'
      default: return ''
    }
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-1">
        <div className="flex items-center space-x-3">
          <div className="text-sm font-medium text-gray-900">{action}</div>
          <div className="text-sm text-gray-500">{time}</div>
        </div>
        <div className="text-sm text-gray-700 mt-1">{value}</div>
      </div>
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
        {getStatusText(status)}
      </div>
    </div>
  )
}

// Страница устройств
const DevicesPage = ({ user }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Мониторинг устройств</h1>
        <p className="text-gray-600 mt-1">Управление IoT устройствами для медицинского мониторинга</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Подключенные устройства</h2>
          <div className="space-y-4">
            {user?.devices?.map((device) => (
              <div key={device.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{device.name}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></span>
                    Активно
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  ID устройства: {device.deviceId}
                </div>
                <div className="text-xs text-gray-500">
                  Последняя активность: {device.lastSeen?.toLocaleString('ru-RU') || 'Недоступно'}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Добавить новое устройство</h3>
            <p className="text-sm text-blue-700 mb-3">
              Для подключения нового устройства обратитесь к администратору системы
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
              Запросить подключение
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Статистика устройств</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{user?.devices?.length || 3}</div>
                <div className="text-sm text-gray-600">Всего устройств</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">100%</div>
                <div className="text-sm text-gray-600">Работоспособность</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Пульсоксиметр</span>
                  <span className="text-sm text-green-600">98 измерений</span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Тонометр</span>
                  <span className="text-sm text-green-600">67 измерений</span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Глюкометр</span>
                  <span className="text-sm text-green-600">45 измерений</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Интеграция с Grafana</h3>
            <div className="bg-gray-900 rounded text-white p-4 h-32">
              <div className="text-center text-gray-400 mt-8">
                <div className="text-lg mb-1">📊 Grafana Dashboard</div>
                <div className="text-xs">Подробная аналитика устройств</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Страница настроек
const SettingsPage = ({ user }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Настройки</h1>
        <p className="text-gray-600 mt-1">Управление системой и профилем пользователя</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Уведомления</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">Email уведомления</div>
                <div className="text-xs text-gray-500">Получать уведомления на {user?.email}</div>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">Критические алерты</div>
                <div className="text-xs text-gray-500">Немедленные уведомления о критических показателях</div>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">Напоминания о лекарствах</div>
                <div className="text-xs text-gray-500">Уведомления о приеме препаратов</div>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">Результаты анализов</div>
                <div className="text-xs text-gray-500">Уведомления о новых результатах</div>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 rounded" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Безопасность</h2>
          <div className="space-y-3">
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200">
              Изменить пароль
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200">
              Двухфакторная аутентификация
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200">
              История входов в систему
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200">
              Управление сессиями
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Экспорт данных</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Выгрузить медицинские данные для передачи другим специалистам
              </p>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                  Экспорт анализов (PDF)
                </button>
                <button className="w-full px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                  Экспорт истории болезни (PDF)
                </button>
                <button className="w-full px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                  Экспорт всех данных (ZIP)
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Конфиденциальность</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">Анонимная аналитика</div>
                <div className="text-xs text-gray-500">Помочь улучшить систему анонимными данными</div>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">Доступ для исследований</div>
                <div className="text-xs text-gray-500">Разрешить использование данных в медицинских исследованиях</div>
              </div>
              <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
            </div>
            <div className="pt-3 border-t border-gray-200">
              <button className="text-sm text-red-600 hover:text-red-700">
                Удалить все данные
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Информация о системе */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Информация о системе</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Версия системы</div>
            <div className="font-medium">MedMonitor v2.1.0</div>
          </div>
          <div>
            <div className="text-gray-500">Последнее обновление</div>
            <div className="font-medium">15.05.2025</div>
          </div>
          <div>
            <div className="text-gray-500">Статус системы</div>
            <div className="font-medium text-green-600">Работает нормально</div>
          </div>
          <div>
            <div className="text-gray-500">Поддержка</div>
            <div className="font-medium">support@medmonitor.ru</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Страница "Скоро будет"
const ComingSoonPage = ({ title }) => {
  return (
    <div className="text-center py-20">
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-6">🚧</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-gray-600 mb-8">
          Этот раздел находится в разработке. Скоро здесь появится новый функционал!
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Что будет доступно:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            {title === 'Пациенты' && (
              <>
                <li>• Список всех пациентов</li>
                <li>• Поиск и фильтрация</li>
                <li>• Детальные профили</li>
                <li>• Управление доступом</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

// Страница 404
const NotFoundPage = () => {
  return (
    <div className="text-center py-20">
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-6">🔍</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Страница не найдена</h1>
        <p className="text-gray-600 mb-8">
          Запрашиваемая страница не существует или была перемещена.
        </p>
        <div className="space-y-3">
          <Link
            to="/dashboard"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Перейти к дашборду
          </Link>
          <div>
            <Link
              to="/main"
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              или вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App