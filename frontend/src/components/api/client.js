const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8045/api/v1'

export const apiClient = {
  async get(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`)
    return response.ok ? response.json() : null
  },

  async post(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.ok ? response.json() : null
  }
}