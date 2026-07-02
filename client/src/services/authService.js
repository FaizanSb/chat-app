// 📍 Location: src/services/authService.js
import axiosInstance from '../utils/axios'

// Register function — Register.jsx isko import karke call karega
export const registerUser = async (userData) => {
  try {
    const response = await axiosInstance.post('/auth/register', userData)
    return response.data
  } catch (error) {
    // axios errors backend ka message error.response.data mein deta hai
    const message =
      error.response?.data?.message || 'Registration failed. Try again.'
    throw new Error(message)
  }
}

// Bonus: login function bhi yahin add kar sakte ho jab banao
export const loginUser = async (credentials) => {
  try {
    const response = await axiosInstance.post('/auth/login', credentials)
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.message || 'Login failed. Try again.'
    throw new Error(message)
  }
}