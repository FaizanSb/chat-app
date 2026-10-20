// 📍 Location: src/utils/axios.js
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const axiosInstance = axios.create({
  baseURL: `${API_URL}/api`, // /auth wagera services mein lagega
  headers: {
    'Content-Type': 'application/json',
  },
})

// Har request ke saath token automatically lagao
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 401 aaye to centrally handle karo
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Session expired or unauthorized. Consider redirecting to login.')
      // window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance