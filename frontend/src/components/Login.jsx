import React, { useState } from 'react'
import { Heart, User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

// Тестовые данные для пользователя Екатерина
const testUser = {
  id: 1,
  fullName: "Смирнова Екатерина Алексеевна",
  email: "ekaterina.smirnova@email.com",
  birthDate: "11.03.2001",
  role: "patient",
  profile: {
    firstName: "Екатерина",
    lastName: "Смирнова",
    patronymic: "Алексеевна",
    phone: "+7 (999) 123-45-67",
    bloodType: "A(II) Rh+",
    height: 165,
    weight: 58,
    allergies: "Нет данных о серьезных аллергиях для этого устройства",
    chronicConditions: "Нет данных",
    emergencyContact: "Мама: +7 (999) 987-65-43"
  },
  devices: [
    { id: 1, name: "Пульсоксиметр", deviceId: "PULSE_001", status: "active", lastSeen: new Date() },
    { id: 2, name: "Тонометр", deviceId: "BP_001", status: "active", lastSeen: new Date() }
  ],
  medicalHistory: [
    { date: "02.05.2025", doctor: "Сидорова Анна Владимировна", diagnosis: "Первичный визит", status: "completed" },
    { date: "15.10.2024", doctor: "Петрова Наталья Ивановна", diagnosis: "Аллергический ринит", status: "monitoring" },
    { date: "12.07.2024", doctor: "Сидорова Анна Владимировна", diagnosis: "ОРЗ", status: "resolved" }
  ],
  medications: [
    { name: "Омепразол", dosage: "20мг", frequency: "1 раз в день", startDate: "01.03.2025" },
    { name: "Анальгин", dosage: "500мг", frequency: "При болях", startDate: "15.02.2025" },
    { name: "Лоратадин", dosage: "10мг", frequency: "1 раз в день", startDate: "10.02.2025" }
  ]
}

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: 'ekaterina.smirnova@email.com',
    password: 'demo123'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('login')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Симуляция проверки авторизации
    setTimeout(() => {
      if (formData.email === 'ekaterina.smirnova@email.com' && formData.password === 'demo123') {
        onLogin(testUser)
      } else {
        setError('Неверный email или пароль')
      }
      setIsLoading(false)
    }, 1500)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <Heart className="h-12 w-12 text-red-500 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Система мониторинга здоровья</h1>
            <p className="text-gray-600 mt-2">Персональный контроль состояния здоровья с применением современных медицинских технологий</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === 'login'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === 'register'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Регистрация
            </button>
          </div>

          <div className="px-8 py-8">
            {activeTab === 'login' ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email или пользователь
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Введите ваш email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Пароль
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Введите пароль"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Вход в систему...
                    </div>
                  ) : (
                    'Войти в систему'
                  )}
                </button>

                <div className="text-center">
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                    Забыли пароль?
                  </a>
                </div>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="mb-4">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Регистрация пациента</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Для получения доступа к системе обратитесь к своему лечащему врачу или в регистратуру медицинского учреждения
                </p>
                <div className="space-y-3">
                  <div className="text-xs text-gray-500">
                    <strong>Для пользователей:</strong>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>• Ввести ваш персональный идентификационный номер</div>
                    <div>• Указать данные электронной почты</div>
                    <div>• Ввести дату рождения-электронной</div>
                    <div>• Пароль</div>
                  </div>
                </div>
                <button className="w-full mt-6 bg-gray-100 text-gray-600 py-3 rounded-lg font-medium cursor-not-allowed">
                  Зарегистрироваться
                </button>
              </div>
            )}
          </div>

          <div className="px-8 pb-8">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">О системе мониторинга:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Пульс и вариабельность сердечного ритма</li>
                <li>• Артериальное давление</li>
                <li>• Сатурация кислорода (SpO2)</li>
                <li>• Температура тела</li>
              </ul>
              <div className="mt-3 text-xs text-blue-600">
                <p><strong>Важно:</strong> Система мониторинга не заменяет экстренную медицинскую помощь. При критических состояниях немедленно обратитесь к врачу.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
