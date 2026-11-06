import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth.js'

function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (isAuthenticated) {
    return (
      <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Vui lòng nhập tài khoản và mật khẩu')
      return
    }

    setIsLoading(true)

    try {
      await login({ username: username.trim(), password })
      navigate(location.state?.from?.pathname || '/dashboard', {
        replace: true,
      })
    } catch (loginError) {
      setError(loginError.message || 'Đăng nhập không thành công')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="eyebrow">Hệ thống quản lý đồ án</p>
        <h1>Đăng nhập</h1>
        <p className="muted">Đăng nhập để theo dõi tiến độ đồ án của bạn.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="username">Tài khoản</label>
          <input
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && <p className="alert-error">{error}</p>}
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
          {import.meta.env.VITE_USE_MOCK === 'true' && (
            <small className="mock-hint">
              Chế độ mock: sv / gv / admin, mật khẩu 123456
            </small>
          )}
        </form>
      </section>
    </main>
  )
}

export default LoginPage
