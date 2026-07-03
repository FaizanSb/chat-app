// 📍 Location: src/pages/Login.jsx
import React, { useState } from 'react'
import { loginUser } from '../services/authService'

const Login = () => {
  // Register jaisa hi pattern — data ek object mein, bas fields kam hain
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)

    try {
      const data = await loginUser(formData)
      console.log('Logged in successfully:', data)


      // Login ke baad token milta hai backend se — usko save karo
      // taake utils/axios.js ka interceptor use kar sake
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        console.log("Saved User:", localStorage.getItem("user"));
        console.log("Parsed User:", JSON.parse(localStorage.getItem("user")));
        console.log("All Storage:", localStorage);
      }

      alert('Login successful!')
      window.location.href = '/chat' // Yahan tum navigate('/dashboard') ya navigate('/') kar sakte ho react-router se
      // Yahan tum navigate('/dashboard') ya navigate('/') kar sakte ho react-router se
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-1">
          Login
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Welcome back! Please login to your account.
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-5">
          Don't have an account?{' '}
          <a href="/register" className="text-blue-600 font-medium hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  )
}

export default Login