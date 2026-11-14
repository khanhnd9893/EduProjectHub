import { Navigate } from 'react-router-dom'
import { isMockMode } from '../../config/runtime.js'
import { useRoleLogin } from './useRoleLogin.js'
import './admin-login.css'

function AdminLoginPage() {
  const {
    username,
    password,
    setUsername,
    setPassword,
    error,
    isLoading,
    isCheckingSession,
    isAuthenticated,
    handleSubmit,
  } = useRoleLogin(['ADMIN', 'TRAINING_MANAGER'])
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  if (isCheckingSession) {
    return <p role="status">Đang kiểm tra phiên đăng nhập...</p>
  }

  return (
    <main className="admin-login">
      <section className="admin-login__card">
        <p className="admin-login__eyebrow">Khu vực quản trị</p>
        <h1>Đăng nhập quản trị</h1>
        <p className="admin-login__subtitle">
          Dành cho quản trị viên và người đào tạo.
        </p>
        <form className="admin-login__form" onSubmit={handleSubmit}>
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
          {error && <p className="admin-login__error" role="alert">{error}</p>}
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập quản trị'}
          </button>
          {isMockMode && (
            <small className="admin-login__hint">
              Mock: admin / daotao · mật khẩu 123456
            </small>
          )}
        </form>
      </section>
    </main>
  )
}

export default AdminLoginPage
