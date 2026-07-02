// 📍 Location: src/utils/axios.js
import axios from 'axios'

// Ye ek hi instance poore app mein reuse hoga — chahe authService ho,
// chahe kal userService ya chatService bane, sabko yehi milega
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api', // /auth wagera services mein lagega
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor: har request ke saath agar token localStorage mein hai,
// toh apne aap Authorization header mein laga do — baar baar likhna nahi padega
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

// Interceptor: agar response 401 (unauthorized) aaye, toh yahan se
// centrally handle kar sakte ho — jaise user ko login page pe bhej dena
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Session expired or unauthorized. Consider redirecting to login.')
      // window.location.href = '/login' // chaho toh yahan uncomment kar lena
    }
    return Promise.reject(error)
  }
)

export default axiosInstance