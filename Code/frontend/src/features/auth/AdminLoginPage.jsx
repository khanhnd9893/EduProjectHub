import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth.js'
import { isMockMode } from '../../config/runtime.js'

const adminRoles = ['ADMIN', 'TRAINING_MANAGER']

function AdminLoginPage() {
  const { isAuthenticated, isLoading: isCheckingSession, login, logout, role } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const destination = location.state?.from?.pathname || '/dashboard'

  if (isAuthenticated && adminRoles.includes(role)) {
    return <Navigate to={destination} replace />
  }

  if (isCheckingSession) {
    return <p role="status">Đang kiểm tra phiên đăng nhập...</p>
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
      const result = await login({ username: username.trim(), password })
      if (!adminRoles.includes(result.user.role)) {
        await logout()
        throw new Error('Tài khoản không có quyền truy cập khu vực quản trị.')
      }
      navigate(destination, { replace: true })
    } catch (loginError) {
      setError(loginError.message || 'Đăng nhập không thành công')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="eyebrow">Khu vực quản trị</p>
        <h1>Đăng nhập quản trị</h1>
        <p className="muted">
          Dành cho quản trị viên và người đào tạo của hệ thống.
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="admin-username">Tài khoản</label>
          <input
            id="admin-username"
            name="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <label htmlFor="admin-password">Mật khẩu</label>
          <input
            id="admin-password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && <p className="alert-error" role="alert">{error}</p>}
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập quản trị'}
          </button>
          {isMockMode && (
            <small className="mock-hint">
              Mock: admin / daotao · mật khẩu 123456
            </small>
          )}
        </form>
        <Link to="/login">Đăng nhập với tài khoản thông thường</Link>
      </section>
    </main>
  )
}

export default AdminLoginPage
