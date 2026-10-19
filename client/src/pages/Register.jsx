// 📍 Location: src/pages/Register.jsx
import React, { useState } from 'react'
import { registerUser } from '../services/authService'

// ---------- Small inline icons (no extra library needed) ----------
const iconProps = {
  className: 'h-5 w-5',
  fill: 'none',
  viewBox: '0 0 24 24',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

const UserIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
)

const MailIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
)

const LockIcon = () => (
  <svg {...iconProps}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
)

const EyeIcon = ({ off }) => (
  <svg {...iconProps}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
)

const ChatIcon = () => (
  <svg {...iconProps} className="h-6 w-6">
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
  </svg>
)

// ---------- Password strength helper ----------
const getStrength = (password) => {
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++

  const levels = [
    { label: 'Too short', color: 'bg-gray-200', text: 'text-gray-400' },
    { label: 'Weak', color: 'bg-red-400', text: 'text-red-500' },
    { label: 'Okay', color: 'bg-amber-400', text: 'text-amber-600' },
    { label: 'Good', color: 'bg-teal-400', text: 'text-teal-600' },
    { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' },
  ]

  if (!password) return { score: 0, ...levels[0], label: '' }
  return { score, ...levels[score] }
}

// ---------- Reusable input field ----------
const Field = ({ id, label, icon, error, children }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
      {label}
    </label>
    <div className="relative">
      <span
        className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${
          error ? 'text-red-400' : 'text-slate-400'
        }`}
      >
        {icon}
      </span>
      {children}
    </div>
    {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
  </div>
)

const inputClass = (hasError) =>
  `w-full rounded-xl border bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-4 ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100'
  }`

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  })

  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const strength = getStrength(formData.password)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Typing shuru karte hi us field ka error hata do
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const errors = {}
    const username = formData.username.trim()

    if (!username) errors.username = 'Username is required.'
    else if (username.length < 2) errors.username = 'Username must be at least 2 characters.'

    if (!formData.email.trim()) errors.email = 'Email is required.'
    else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim()))
      errors.email = 'Enter a valid email address.'

    if (!formData.password) errors.password = 'Password is required.'
    else if (formData.password.length < 6)
      errors.password = 'Password must be at least 6 characters.'

    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setSuccess('')

    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setLoading(true)

    try {
      const data = await registerUser({
        ...formData,
        username: formData.username.trim(),
        email: formData.email.trim(),
      })
      console.log('Registered successfully:', data)
      setSuccess('Account created! You can now log in.')
      setFormData({ username: '', email: '', password: '' })
      // Yahan navigate('/login') bhi kar sakte ho react-router se
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* ---------- Left: brand panel (desktop only) ---------- */}
      <aside className="relative hidden w-1/2 overflow-hidden bg-slate-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* soft background glows */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative flex items-center gap-3 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400 text-slate-900">
            <ChatIcon />
          </span>
          <span className="text-lg font-semibold tracking-tight">Chat App</span>
        </div>

        <div className="relative">
          <h2 className="max-w-md text-4xl font-bold leading-tight text-white">
            Talk to anyone, the moment they're online.
          </h2>
          <p className="mt-4 max-w-md text-slate-400">
            Real-time messages, voice notes, and live typing status. Create an account and
            start your first conversation.
          </p>

          {/* mock conversation */}
          <div className="mt-10 max-w-sm space-y-3">
            <div className="w-fit rounded-2xl rounded-bl-sm bg-slate-800 px-4 py-2.5 text-sm text-slate-200">
              Hey! Did you get my voice note? 🎙️
            </div>
            <div className="ml-auto w-fit rounded-2xl rounded-br-sm bg-teal-400 px-4 py-2.5 text-sm font-medium text-slate-900">
              Just listened, sounds great!
            </div>
            <div className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-sm bg-slate-800 px-4 py-3">
              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
            </div>
          </div>
        </div>

        <p className="relative text-sm text-slate-500">Fast. Private. Always in sync.</p>
      </aside>

      {/* ---------- Right: form ---------- */}
      <main className="flex w-full items-center justify-center px-5 py-10 sm:px-8 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-teal-400">
              <ChatIcon />
            </span>
            <span className="text-lg font-semibold text-slate-900">Chat App</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create your account</h1>
          <p className="mt-2 text-sm text-slate-500">
            It takes less than a minute. No credit card needed.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            >
              <span>{success}</span>
              <a href="/login" className="font-semibold underline underline-offset-2">
                Log in
              </a>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            <Field id="username" label="Username" icon={<UserIcon />} error={fieldErrors.username}>
              <input
                id="username"
                type="text"
                name="username"
                autoComplete="username"
                placeholder="e.g. faizan"
                value={formData.username}
                onChange={handleChange}
                className={inputClass(fieldErrors.username)}
              />
            </Field>

            <Field id="email" label="Email" icon={<MailIcon />} error={fieldErrors.email}>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className={inputClass(fieldErrors.email)}
              />
            </Field>

            <div>
              <Field id="password" label="Password" icon={<LockIcon />} error={fieldErrors.password}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className={`${inputClass(fieldErrors.password)} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  <EyeIcon off={showPassword} />
                </button>
              </Field>

              {/* strength meter */}
              {formData.password && (
                <div className="mt-2.5">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <span
                        key={step}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          strength.score >= step ? strength.color : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`mt-1.5 text-xs font-medium ${strength.text}`}>{strength.label}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-90" />
                </svg>
              )}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <a href="/login" className="font-semibold text-teal-600 hover:text-teal-700 hover:underline">
              Log in
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}

export default Register