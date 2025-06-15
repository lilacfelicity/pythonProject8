import React, { useState } from 'react'
import { Heart, User, Lock, Eye, EyeOff, AlertCircle, Loader2, Phone, Calendar, MapPin, UserCheck } from 'lucide-react'
import api from '../services/api'

const Login = ({ onLogin }) => {
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })

  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    birth_date: '',
    gender: 'other',
    patronymic: '',
    address: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('login')

  // Обработка входа в систему
  const handleLogin = async (e) => {
    e.preventDefault()
    console.log('Login: Form submitted')

    if (!loginData.email || !loginData.password) {
      setError('Пожалуйста, заполните все поля')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      console.log('Login: Starting login process for:', loginData.email)

      const loginResponse = await api.login(loginData.email, loginData.password)
      console.log('Login: Login successful, received response:', loginResponse)

      let userInfo = loginResponse.user || loginResponse

      if (!userInfo.id && !userInfo.user_id) {
        console.log('Login: Getting additional user info...')
        try {
          userInfo = await api.getMe()
          console.log('Login: User info received:', userInfo)
        } catch (meError) {
          console.error('Login: Failed to get user info:', meError)
          userInfo = loginResponse
        }
      }

      const completeUserInfo = {
        id: userInfo.id || userInfo.user_id,
        email: userInfo.email || loginData.email,
        fullName: userInfo.full_name || userInfo.fullName || `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim(),
        full_name: userInfo.full_name || userInfo.fullName,
        username: userInfo.username || userInfo.email || loginData.email,
        first_name: userInfo.first_name,
        last_name: userInfo.last_name,
        phone: userInfo.phone,
        role: userInfo.role || 'patient',
        is_active: userInfo.is_active !== false,
        profile: userInfo.profile || {},
        devices: userInfo.devices || [],
        created_at: userInfo.created_at,
        last_login: userInfo.last_login,
        ...userInfo
      }

      console.log('Login: Complete user info prepared:', completeUserInfo)

      if (!completeUserInfo.id) {
        throw new Error('Получены неполные данные пользователя. Обратитесь к администратору.')
      }

      if (!completeUserInfo.is_active) {
        throw new Error('Ваш аккаунт заблокирован. Обратитесь к администратору.')
      }

      console.log('Login: Calling onLogin with user data')
      onLogin(completeUserInfo)

    } catch (error) {
      console.error('Login: Error occurred:', error)

      let errorMessage = 'Ошибка авторизации'

      if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Неверный email или пароль'
      } else if (error.message.includes('Network') || error.message.includes('Connection')) {
        errorMessage = 'Ошибка подключения к серверу. Проверьте интернет-соединение.'
      } else if (error.message) {
        errorMessage = error.message
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Обработка регистрации
  const handleRegister = async (e) => {
    e.preventDefault()
    console.log('Register: Form submitted')

    // Валидация обязательных полей
    if (!registerData.email || !registerData.password || !registerData.first_name ||
        !registerData.last_name || !registerData.phone) {
      setError('Пожалуйста, заполните все обязательные поля')
      return
    }

    // Проверка пароля
    if (registerData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов')
      return
    }

    // Проверка подтверждения пароля
    if (registerData.password !== registerData.confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      console.log('Register: Starting registration process for:', registerData.email)

      // Подготавливаем данные для регистрации
      const registrationData = {
        email: registerData.email.trim(),
        password: registerData.password,
        first_name: registerData.first_name.trim(),
        last_name: registerData.last_name.trim(),
        phone: registerData.phone.trim(),
        gender: registerData.gender,
        birth_date: registerData.birth_date || null,
        patronymic: registerData.patronymic.trim() || null,
        address: registerData.address.trim() || null
      }

      console.log('Register: Registration data prepared:', registrationData)

      // Регистрируемся с автоматическим входом
      const response = await api.registerAndLogin(registrationData)
      console.log('Register: Registration successful:', response)

      // Получаем данные пользователя
      let userInfo = response.user || response
      if (!userInfo.id) {
        console.log('Register: Getting user info after registration...')
        userInfo = await api.getMe()
      }

      const completeUserInfo = {
        id: userInfo.id,
        email: userInfo.email || registrationData.email,
        fullName: userInfo.full_name || `${registrationData.first_name} ${registrationData.last_name}`,
        full_name: userInfo.full_name,
        username: userInfo.username || registrationData.email,
        first_name: userInfo.first_name || registrationData.first_name,
        last_name: userInfo.last_name || registrationData.last_name,
        phone: userInfo.phone || registrationData.phone,
        role: userInfo.role || 'patient',
        is_active: true,
        ...userInfo
      }

      console.log('Register: Complete user info prepared:', completeUserInfo)

      setSuccess('Регистрация успешна! Добро пожаловать в систему!')

      // Автоматически входим в систему
      setTimeout(() => {
        onLogin(completeUserInfo)
      }, 1500)

    } catch (error) {
      console.error('Register: Error occurred:', error)

      let errorMessage = 'Ошибка регистрации'

      if (error.message.includes('уже существует')) {
        errorMessage = 'Пользователь с таким email уже зарегистрирован'
      } else if (error.message.includes('Network') || error.message.includes('Connection')) {
        errorMessage = 'Ошибка подключения к серверу. Проверьте интернет-соединение.'
      } else if (error.message) {
        errorMessage = error.message
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    })
    if (error) setError('')
  }

  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value
    })
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleTestLogin = () => {
    setLoginData({
      email: 'test@example.com',
      password: 'password123'
    })
    setError('')
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setError('')
    setSuccess('')
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
            <h1 className="text-2xl font-bold text-gray-900">MedMonitor</h1>
            <p className="text-gray-600 mt-2">Система медицинского мониторинга здоровья</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => handleTabChange('login')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'login'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Вход в систему
            </button>
            <button
              onClick={() => handleTabChange('register')}
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
            {/* Сообщения об ошибках и успехе */}
            {error && (
              <div className="flex items-center space-x-2 p-3 mb-6 bg-red-50 border border-red-200 rounded-lg animate-in slide-in-from-top duration-200">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2 p-3 mb-6 bg-green-50 border border-green-200 rounded-lg animate-in slide-in-from-top duration-200">
                <UserCheck className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-green-700">{success}</span>
              </div>
            )}

            {activeTab === 'login' ? (
              /* Форма входа */
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email адрес *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Введите ваш email"
                      required
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Пароль *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Введите пароль"
                      required
                      disabled={isLoading}
                      autoComplete="current-password"
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
                  disabled={isLoading || !loginData.email || !loginData.password}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Авторизация...
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
                      onClick={handleTestLogin}
                      disabled={isLoading}
                      className="w-full text-sm text-gray-600 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Заполнить тестовыми данными
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Только в режиме разработки
                    </p>
                  </div>
                )}
              </form>
            ) : (
              /* Форма регистрации */
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Имя *
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={registerData.first_name}
                      onChange={handleRegisterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                      placeholder="Ваше имя"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Фамилия *
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={registerData.last_name}
                      onChange={handleRegisterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                      placeholder="Ваша фамилия"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email адрес *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                      placeholder="email@example.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={registerData.phone}
                      onChange={handleRegisterChange}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                      placeholder="+7 (999) 123-45-67"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Пароль *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={registerData.password}
                        onChange={handleRegisterChange}
                        className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                        placeholder="Минимум 6 символов"
                        required
                        disabled={isLoading}
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Подтверждение *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={registerData.confirmPassword}
                        onChange={handleRegisterChange}
                        className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                        placeholder="Повторите пароль"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Дополнительные поля */}
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Дата рождения
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                          type="date"
                          name="birth_date"
                          value={registerData.birth_date}
                          onChange={handleRegisterChange}
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Пол
                      </label>
                      <select
                        name="gender"
                        value={registerData.gender}
                        onChange={handleRegisterChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                        disabled={isLoading}
                      >
                        <option value="male">Мужской</option>
                        <option value="female">Женский</option>
                        <option value="other">Не указан</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Отчество
                    </label>
                    <input
                      type="text"
                      name="patronymic"
                      value={registerData.patronymic}
                      onChange={handleRegisterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                      placeholder="Отчество (необязательно)"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Адрес
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name="address"
                        value={registerData.address}
                        onChange={handleRegisterChange}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                        placeholder="Адрес проживания (необязательно)"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !registerData.email || !registerData.password ||
                          !registerData.first_name || !registerData.last_name || !registerData.phone}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Регистрация...
                    </div>
                  ) : (
                    'Создать аккаунт'
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Поля отмеченные * обязательны для заполнения
                </p>
              </form>
            )}
          </div>

          {/* System Info */}
          <div className="px-8 pb-8">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Система мониторинга включает:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Непрерывный мониторинг витальных функций</li>
                <li>• Анализ лабораторных данных и показателей</li>
                <li>• Ведение электронной медицинской карты</li>
                <li>• Интеграция с медицинскими IoT устройствами</li>
                <li>• Мгновенные уведомления о критических состояниях</li>
              </ul>
              <div className="mt-3 text-xs text-blue-600">
                <p><strong>Важно:</strong> Система мониторинга не заменяет экстренную медицинскую помощь.
                При критических состояниях немедленно обратитесь к врачу или вызовите скорую помощь.</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 pb-4">
            <div className="text-center text-xs text-gray-500">
              <p>MedMonitor v2.1.0 • Защищено протоколом HTTPS</p>
              <p className="mt-1">
                <a href="#" className="hover:text-blue-600">Политика конфиденциальности</a>
                {' • '}
                <a href="#" className="hover:text-blue-600">Условия использования</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login