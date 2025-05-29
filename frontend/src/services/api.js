const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:80'

class ApiService {
  constructor() {
    this.baseUrl = API_URL
    this.isRefreshing = false
    this.failedQueue = []
  }

  // Получение access token
  getAccessToken() {
    return localStorage.getItem('access_token')
  }

  // Получение refresh token
  getRefreshToken() {
    return localStorage.getItem('refresh_token')
  }

  // Сохранение токенов
  setTokens(accessToken, refreshToken) {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
  }

  // Очистка токенов
  clearTokens() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('medmonitor_user')
  }

  // Получение заголовков для запросов
  getHeaders() {
    const token = this.getAccessToken()
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }

  // Обработка неуспешного запроса с очередью для refresh token
  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error)
      } else {
        resolve(token)
      }
    })

    this.failedQueue = []
  }

  // Обновление access token с помощью refresh token
  async refreshAccessToken() {
    const refreshToken = this.getRefreshToken()

    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to refresh token')
      }

      const data = await response.json()
      this.setTokens(data.access_token, data.refresh_token)

      return data.access_token
    } catch (error) {
      // Если не удалось обновить токен, очищаем все токены
      this.clearTokens()
      throw error
    }
  }

  // Основной метод для выполнения запросов
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`

    const makeRequest = async (token) => {
      const config = {
        ...options,
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...(options.body && { 'Content-Type': 'application/json' }),
          ...options.headers
        }
      }

      console.log(`Making request to ${url}`, {
        method: config.method || 'GET',
        headers: config.headers,
        hasBody: !!config.body
      })

      return fetch(url, config)
    }

    try {
      const token = this.getAccessToken()
      let response = await makeRequest(token)

      // Если получили 401, пытаемся обновить токен
      if (response.status === 401 || response.status === 403 && token) {
        // Если уже обновляем токен, добавляем запрос в очередь
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.failedQueue.push({
              resolve: (newToken) => {
                resolve(makeRequest(newToken).then(res => this.handleResponse(res)))
              },
              reject: (err) => {
                reject(err)
              }
            })
          })
        }

        this.isRefreshing = true

        try {
          const newToken = await this.refreshAccessToken()
          this.processQueue(null, newToken)
          this.isRefreshing = false

          // Повторяем запрос с новым токеном
          response = await makeRequest(newToken)
        } catch (refreshError) {
          this.processQueue(refreshError, null)
          this.isRefreshing = false

          // Если не удалось обновить токен, перенаправляем на логин
          this.handleUnauthorized()
          throw refreshError
        }
      }

      return this.handleResponse(response)
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Обработка ответа
  async handleResponse(response) {
    if (!response.ok) {
      if (response.status === 401) {
        this.handleUnauthorized()
      }

      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorData.message || errorMessage
      } catch (e) {
        // Если не удалось разобрать JSON, используем стандартное сообщение
      }

      throw new Error(errorMessage)
    }

    return await response.json()
  }

  // Обработка неавторизованного доступа
  handleUnauthorized() {
    this.clearTokens()

    // Перенаправляем на страницу логина если мы не на ней
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  // Auth endpoints
  async login(email, password) {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}: Login failed`)
    }

    const data = await response.json()

    // Сохраняем токены
    this.setTokens(data.access_token, data.refresh_token)

    return data
  }

  async register(userData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  }

  async getMe() {
    return this.request('/api/auth/me')
  }

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.warn('Logout request failed:', error)
    } finally {
      this.clearTokens()
    }
  }

  async verifyToken() {
    return this.request('/api/auth/verify')
  }

  // Vitals endpoints
  async getVitalsDashboard() {
    return this.request('/api/vitals/dashboard')
  }

  async getVitalsHistory(vitalType, hours = 24) {
    return this.request(`/api/vitals/history/${vitalType}?hours=${hours}`)
  }

  async getLatestVitals() {
    return this.request('/api/vitals/latest')
  }

  async getAlerts(limit = 20) {
    return this.request(`/api/vitals/alerts?limit=${limit}`)
  }

  async addVitals(vitalData) {
    return this.request('/api/vitals/', {
      method: 'POST',
      body: JSON.stringify(vitalData)
    })
  }

  // Devices endpoints
  async getDevices() {
    return this.request('/api/devices')
  }

  async registerDevice(deviceData) {
    return this.request('/api/devices', {
      method: 'POST',
      body: JSON.stringify(deviceData)
    })
  }

  async deleteDevice(deviceId) {
    return this.request(`/api/devices/${deviceId}`, {
      method: 'DELETE'
    })
  }

  async updateDeviceStatus(deviceId, status) {
    return this.request(`/api/devices/${deviceId}/status?status=${status}`, {
      method: 'PATCH'
    })
  }

  // Analytics endpoints
  async getAnalyticsSummary(days = 7) {
    return this.request(`/api/analytics/summary?days=${days}`)
  }

  async getAnalyticsTrends(metric, hours = 24) {
    return this.request(`/api/analytics/trends?metric=${metric}&hours=${hours}`)
  }

  async getDeviceStats() {
    return this.request('/api/analytics/devices/stats')
  }

  async getHourlyAggregates() {
    return this.request('/api/analytics/hourly')
  }

  // Utility methods
  isAuthenticated() {
    return !!this.getAccessToken()
  }

  async checkAuthStatus() {
    if (!this.isAuthenticated()) {
      return false
    }

    try {
      await this.verifyToken()
      return true
    } catch (error) {
      return false
    }
  }
}

export default new ApiService()