// Замените ваш components/Login.jsx на этот код:

import React, { useState } from 'react'
import { Heart, User, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import api from '../services/api'

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('login')

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('Login: Form submitted')

    setIsLoading(true)
    setError('')

    try {
      console.log('Login: Starting login process for:', formData.email)

      // Авторизация через API - этот метод должен вернуть токены И данные пользователя
      const loginData = await api.login(formData.email, formData.password)
      console.log('Login: Login successful, received data:', loginData)

      // Если в ответе логина нет данных пользователя, получаем их отдельно
      let userInfo = loginData.user || loginData

      // Если нет полных данных пользователя, делаем дополнительный запрос
      if (!userInfo.id && !userInfo.user_id) {
        console.log('Login: Getting additional user info...')
        userInfo = await api.getMe()
        console.log('Login: User info received:', userInfo)
      }

      // Убеждаемся что у пользователя есть все необходимые поля
      const completeUserInfo = {
        id: userInfo.id || userInfo.user_id,
        email: userInfo.email,
        fullName: userInfo.full_name || userInfo.fullName || `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim(),
        full_name: userInfo.full_name || userInfo.fullName,
        username: userInfo.username,
        first_name: userInfo.first_name,
        last_name: userInfo.last_name,
        profile: userInfo.profile || {},
        devices: userInfo.devices || [],
        ...userInfo
      }

      console.log('Login: Complete user info prepared:', completeUserInfo)

      // Проверяем что ID присутствует
      if (!completeUserInfo.id) {
        throw new Error('User data incomplete: missing ID field')
      }

      console.log('Login: Calling onLogin with user data')
      onLogin(completeUserInfo)

    } catch (error) {
      console.error('Login: Error occurred:', error)
      setError(error.message || 'Ошибка авторизации')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Очищаем ошибку при изменении полей
    if (error) {
      setError('')
    }
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
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'login'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
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
                  <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg animate-in slide-in-from-top duration-200">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Введите ваш email"
                      required
                      disabled={isLoading}
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
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Введите пароль"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !formData.email || !formData.password}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Вход в систему...
                    </div>
                  ) : (
                    'Войти в систему'
                  )}
                </button>

                <div className="text-center">
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
                    Забыли пароль?
                  </a>
                </div>

                {/* Кнопка для быстрого тестирования */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ email: 'test@example.com', password: 'password123' })
                      }}
                      className="w-full text-sm text-gray-600 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Заполнить тестовыми данными
                    </button>
                  </div>
                )}
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
                    <strong>Для регистрации необходимо:</strong>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1 text-left bg-gray-50 p-4 rounded-lg">
                    <div>• Персональный идентификационный номер</div>
                    <div>• Данные электронной почты</div>
                    <div>• Дата рождения</div>
                    <div>• Телефон для связи</div>
                  </div>
                </div>
                <button className="w-full mt-6 bg-gray-100 text-gray-600 py-3 rounded-lg font-medium cursor-not-allowed">
                  Зарегистрироваться
                </button>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="px-8 pb-8">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Система мониторинга:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Мониторинг пульса и давления</li>
                <li>• Анализ лабораторных данных</li>
                <li>• История болезни и лечения</li>
                <li>• Интеграция с IoT устройствами</li>
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