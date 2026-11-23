import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { isMockMode } from '../../config/runtime.js'
import { useRoleLogin } from './useRoleLogin.js'
import './student-login.css'

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
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
      <section className="student-login__panel">
        <div className="student-login__intro">
          <div className="student-login__brand-row">
            <span className="student-login__brand-icon" aria-hidden="true">
              <svg fill="none" viewBox="0 0 24 24">
                <path d="M3 9.2 12 4l9 5.2-9 5.1-9-5.1Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
                <path d="M6.5 11.3v4.1c3.4 2.7 7.6 2.7 11 0v-4.1M21 9.2v5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
              </svg>
            </span>
            <span className="student-login__brand-name">EDUPROJECTHUB</span>
          </div>
          <h1>Cổng sinh viên</h1>
          <p>Theo dõi nhóm, nhiệm vụ và tiến độ đồ án của bạn trong một không gian tập trung.</p>
        </div>
        <section className="student-login__card">
          <div className="student-login__form-heading">
            <h2>Đăng nhập sinh viên</h2>
            <p className="student-login__welcome">Sử dụng tài khoản sinh viên của bạn.</p>
          </div>
          <form className="student-login__form" onSubmit={handleSubmit}>
          <label htmlFor="student-username">Tài khoản</label>
          <input
            autoComplete="username"
            id="student-username"
            name="username"
            placeholder="Nhập tên đăng nhập"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <label htmlFor="student-password">Mật khẩu</label>
          <div className="student-login__password-control">
            <input
              autoComplete="current-password"
              id="student-password"
              name="password"
              placeholder="Nhập mật khẩu"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="student-login__password-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              type="button"
            >
              {showPassword ? (
                <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                  <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.2A11.4 11.4 0 0112 5c5 0 8.5 4.1 9.5 6.5a10.8 10.8 0 01-3.1 4.2M6.2 6.2C3.9 7.6 2.8 9.7 2.5 11.5c.5 1.3 1.6 3.1 3.5 4.5A10.8 10.8 0 0012 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                </svg>
              ) : (
                <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                  <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              )}
            </button>
          </div>
          {error && <p className="student-login__error" role="alert">{error}</p>}
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
          {isMockMode && (
            <small className="student-login__hint">
              Mock: sv / sv2 / truongnhom · mật khẩu 123456
            </small>
          )}
          <p className="student-login__portal-link">
            Bạn là giảng viên? <Link to="/lecturer-login">Chuyển sang Cổng giảng viên</Link>
          </p>
          </form>
        </section>
      </section>
    </main>
  )
}

export default LoginPage
