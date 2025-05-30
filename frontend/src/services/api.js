// Замените ваш services/api.js на этот код:

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.31.137:80'

class ApiService {
  constructor() {
    this.baseUrl = API_URL
    this.isRefreshing = false
    this.failedQueue = []
    console.log('ApiService: Initialized with base URL:', this.baseUrl)
  }

  // Получение access token
  getAccessToken() {
    const token = localStorage.getItem('access_token')
    console.log('ApiService: Getting access token:', token ? `${token.substring(0, 20)}...` : 'Missing')
    return token
  }

  // Получение refresh token
  getRefreshToken() {
    const token = localStorage.getItem('refresh_token')
    console.log('ApiService: Getting refresh token:', token ? 'Present' : 'Missing')
    return token
  }

  // Сохранение токенов
  setTokens(accessToken, refreshToken) {
    console.log('ApiService: Setting tokens:', {
      accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : 'Missing',
      refreshToken: refreshToken ? 'Present' : 'Missing'
    })

    if (accessToken) {
      localStorage.setItem('access_token', accessToken)
    }
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken)
    }
  }

  // Очистка токенов
  clearTokens() {
    console.log('ApiService: Clearing all tokens')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('medmonitor_user')
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

    console.log('ApiService: Attempting to refresh access token')

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        }
      })

      console.log('ApiService: Refresh response status:', response.status)

      if (!response.ok) {
        throw new Error('Failed to refresh token')
      }

      const data = await response.json()
      console.log('ApiService: Token refresh successful')
      this.setTokens(data.access_token, data.refresh_token)

      return data.access_token
    } catch (error) {
      console.error('ApiService: Token refresh failed:', error)
      // Если не удалось обновить токен, очищаем все токены
      this.clearTokens()
      throw error
    }
  }

  // Основной метод для выполнения запросов
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`

    const makeRequest = async (token) => {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      }

      // ВАЖНО: Правильно добавляем Bearer token
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
        console.log('ApiService: Added Authorization header with token:', `${token.substring(0, 20)}...`)
      } else {
        console.log('ApiService: No token available for request')
      }

      const config = {
        method: 'GET',
        ...options,
        headers
      }

      console.log(`ApiService: Making ${config.method} request to ${url}`, {
        hasAuth: !!headers['Authorization'],
        hasBody: !!config.body,
        headers: Object.keys(headers)
      })

      return fetch(url, config)
    }

    try {
      const token = this.getAccessToken()
      let response = await makeRequest(token)

      console.log(`ApiService: Response status: ${response.status}`)

      // Если получили 401 или 403, пытаемся обновить токен
      if ((response.status === 401 || response.status === 403) && token) {
        console.log('ApiService: Got auth error, attempting token refresh')

        // Если уже обновляем токен, добавляем запрос в очередь
        if (this.isRefreshing) {
          console.log('ApiService: Token refresh in progress, queueing request')
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

          console.log('ApiService: Retrying request with new token')
          // Повторяем запрос с новым токеном
          response = await makeRequest(newToken)
        } catch (refreshError) {
          this.processQueue(refreshError, null)
          this.isRefreshing = false

          console.log('ApiService: Token refresh failed, redirecting to login')
          // Если не удалось обновить токен, перенаправляем на логин
          this.handleUnauthorized()
          throw refreshError
        }
      }

      return this.handleResponse(response)
    } catch (error) {
      console.error('ApiService: Request failed:', error)
      throw error
    }
  }

  // Обработка ответа
  async handleResponse(response) {
    console.log(`ApiService: Handling response with status: ${response.status}`)

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.log('ApiService: Unauthorized response, handling logout')
        this.handleUnauthorized()
      }

      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorData.message || errorMessage
        console.log('ApiService: Error response data:', errorData)
      } catch (e) {
        console.log('ApiService: Could not parse error response JSON')
      }

      throw new Error(errorMessage)
    }

    try {
      const data = await response.json()
      console.log('ApiService: Response data received successfully')
      return data
    } catch (e) {
      console.warn('ApiService: Failed to parse response JSON, returning empty object')
      return {}
    }
  }

  // Обработка неавторизованного доступа
  handleUnauthorized() {
    console.log('ApiService: Handling unauthorized access - clearing tokens')
    this.clearTokens()

    // Перенаправляем на страницу логина если мы не на ней
    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
      console.log('ApiService: Redirecting to login page')
      window.location.href = '/login'
    }
  }

  // Auth endpoints
  async login(email, password) {
    console.log('ApiService: Attempting login for:', email)

    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    })

    console.log('ApiService: Login response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: Login failed`
      console.error('ApiService: Login failed:', errorMessage)
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log('ApiService: Login response data:', {
      hasAccessToken: !!data.access_token,
      hasRefreshToken: !!data.refresh_token,
      hasUser: !!data.user,
      userData: data.user || data
    })

    // Сохраняем токены
    if (data.access_token && data.refresh_token) {
      this.setTokens(data.access_token, data.refresh_token)
    } else {
      console.warn('ApiService: Login response missing tokens')
    }

    return data
  }

  async register(userData) {
    console.log('ApiService: Attempting registration')
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  }

  async getMe() {
    console.log('ApiService: Getting user profile')
    return this.request('/api/auth/me')
  }

  async logout() {
    console.log('ApiService: Attempting logout')
    try {
      await this.request('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.warn('ApiService: Logout request failed:', error)
    } finally {
      this.clearTokens()
    }
  }

  async verifyToken() {
    console.log('ApiService: Verifying token')
    return this.request('/api/auth/verify')
  }

  // Vitals endpoints
  async getVitalsDashboard() {
    console.log('ApiService: Getting vitals dashboard')
    return this.request('/api/vitals/dashboard')
  }

  async getVitalsHistory(vitalType, hours = 24) {
    console.log('ApiService: Getting vitals history:', { vitalType, hours })
    return this.request(`/api/vitals/history/${vitalType}?hours=${hours}`)
  }

  async getLatestVitals() {
    console.log('ApiService: Getting latest vitals')
    return this.request('/api/vitals/latest')
  }

  async getAlerts(limit = 20) {
    console.log('ApiService: Getting alerts, limit:', limit)
    return this.request(`/api/vitals/alerts?limit=${limit}`)
  }

  async addVitals(vitalData) {
    console.log('ApiService: Adding vitals data')
    return this.request('/api/vitals/', {
      method: 'POST',
      body: JSON.stringify(vitalData)
    })
  }

  // Devices endpoints
  async getDevices() {
    console.log('ApiService: Getting devices')
    return this.request('/api/devices')
  }

  async registerDevice(deviceData) {
    console.log('ApiService: Registering device')
    return this.request('/api/devices', {
      method: 'POST',
      body: JSON.stringify(deviceData)
    })
  }

  async deleteDevice(deviceId) {
    console.log('ApiService: Deleting device:', deviceId)
    return this.request(`/api/devices/${deviceId}`, {
      method: 'DELETE'
    })
  }

  async updateDeviceStatus(deviceId, status) {
    console.log('ApiService: Updating device status:', { deviceId, status })
    return this.request(`/api/devices/${deviceId}/status?status=${status}`, {
      method: 'PATCH'
    })
  }

  // Analytics endpoints
  async getAnalyticsSummary(days = 7) {
    console.log('ApiService: Getting analytics summary, days:', days)
    return this.request(`/api/analytics/summary?days=${days}`)
  }

  async getAnalyticsTrends(metric, hours = 24) {
    console.log('ApiService: Getting analytics trends:', { metric, hours })
    return this.request(`/api/analytics/trends?metric=${metric}&hours=${hours}`)
  }

  async getDeviceStats() {
    console.log('ApiService: Getting device stats')
    return this.request('/api/analytics/devices/stats')
  }

  async getHourlyAggregates() {
    console.log('ApiService: Getting hourly aggregates')
    return this.request('/api/analytics/hourly')
  }

  // Utility methods
  isAuthenticated() {
    const hasToken = !!this.getAccessToken()
    console.log('ApiService: Checking authentication:', hasToken)
    return hasToken
  }

  async checkAuthStatus() {
    console.log('ApiService: Checking auth status')
    if (!this.isAuthenticated()) {
      console.log('ApiService: No token found for auth check')
      return false
    }

    try {
      await this.verifyToken()
      console.log('ApiService: Token is valid')
      return true
    } catch (error) {
      console.log('ApiService: Token verification failed:', error.message)
      return false
    }
  }
}

export default new ApiService()