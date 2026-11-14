import { Navigate } from 'react-router-dom'
import { isMockMode } from '../../config/runtime.js'
import { useRoleLogin } from './useRoleLogin.js'
import './student-login.css'

function LoginPage() {
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
  } = useRoleLogin(['STUDENT', 'TEAM_LEADER'])

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  if (isCheckingSession) {
    return <p role="status">Đang kiểm tra phiên đăng nhập...</p>
  }

  return (
    <main className="student-login">
      <section className="student-login__card">
        <p className="student-login__eyebrow">Cổng sinh viên</p>
        <h1>Đăng nhập</h1>
        <p className="student-login__welcome">
          Chào mừng bạn trở lại. Theo dõi nhóm và tiến độ đồ án của bạn.
        </p>
        <form className="student-login__form" onSubmit={handleSubmit}>
          <label htmlFor="student-username">Tài khoản</label>
          <input
            id="student-username"
            name="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <label htmlFor="student-password">Mật khẩu</label>
          <input
            id="student-password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && <p className="student-login__error" role="alert">{error}</p>}
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
          {isMockMode && (
            <small className="student-login__hint">
              Mock: sv / sv2 / truongnhom · mật khẩu 123456
            </small>
          )}
        </form>
      </section>
    </main>
  )
}

export default LoginPage
