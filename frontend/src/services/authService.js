import api from './api'

export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message)
    throw error
  }
}

export const getMe = async () => {
  try {
    const response = await api.get('/auth/me')
    return response.data
  } catch (error) {
    console.error('Get me error:', error.response?.data || error.message)
    throw error
  }
}