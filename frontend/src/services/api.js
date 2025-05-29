const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:80'

class ApiService {
  constructor() {
    this.baseUrl = API_URL
  }

  getHeaders() {
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        if (response.status === 401) {
          // Handle unauthorized
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Auth
  async login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  }

  async register(data) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async getMe() {
    return this.request('/api/auth/me')
  }

  // Vitals
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

  // Devices
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

  // Analytics
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
}

export default new ApiService()