import { Navigate } from 'react-router-dom'
import { isMockMode } from '../../config/runtime.js'
import { useRoleLogin } from './useRoleLogin.js'
import './lecturer-login.css'

function LecturerLoginPage() {
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
  } = useRoleLogin(['LECTURER'])
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  if (isCheckingSession) {
    return <p role="status">Đang kiểm tra phiên đăng nhập...</p>
  }

  return (
    <main className="lecturer-login">
      <section className="lecturer-login__intro">
        <p className="lecturer-login__eyebrow">EduProjectHub</p>
        <h1>Cổng giảng viên</h1>
        <p>
          Quản lý đề tài, nhóm sinh viên và theo dõi tiến độ hướng dẫn trong
          một không gian tập trung.
        </p>
      </section>
      <section className="lecturer-login__card">
        <h2>Đăng nhập giảng viên</h2>
        <p className="lecturer-login__subtitle">Sử dụng tài khoản giảng viên của bạn.</p>
        <form className="lecturer-login__form" onSubmit={handleSubmit}>
          <label htmlFor="lecturer-username">Tài khoản</label>
          <input
            id="lecturer-username"
            name="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <label htmlFor="lecturer-password">Mật khẩu</label>
          <input
            id="lecturer-password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && <p className="lecturer-login__error" role="alert">{error}</p>}
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Đang đăng nhập...' : 'Vào cổng giảng viên'}
          </button>
          {isMockMode && (
            <small className="lecturer-login__hint">
              Mock: gv · mật khẩu 123456
            </small>
          )}
        </form>
      </section>
    </main>
  )
}

export default LecturerLoginPage
