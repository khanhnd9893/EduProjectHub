import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { isMockMode } from '../../config/runtime.js'
import { useRoleLogin } from './useRoleLogin.js'
import './lecturer-login.css'

function LecturerLoginPage() {
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
  } = useRoleLogin(['LECTURER'])
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  if (isCheckingSession) {
    return <p role="status">Đang kiểm tra phiên đăng nhập...</p>
  }

  return (
    <main className="lecturer-login">
      <div className="lecturer-login__panel">
      <section className="lecturer-login__intro">
        <div className="lecturer-login__brand-row">
          <span className="lecturer-login__brand-icon" aria-hidden="true">
            <svg fill="none" viewBox="0 0 24 24">
              <path d="M3 9.2 12 4l9 5.2-9 5.1-9-5.1Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
              <path d="M6.5 11.3v4.1c3.4 2.7 7.6 2.7 11 0v-4.1M21 9.2v5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
            </svg>
          </span>
          <p className="lecturer-login__eyebrow">EDUPROJECTHUB</p>
        </div>
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
            autoComplete="username"
            id="lecturer-username"
            name="username"
            placeholder="Nhập tên đăng nhập"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <label htmlFor="lecturer-password">Mật khẩu</label>
          <div className="lecturer-login__password-control">
            <input
              autoComplete="current-password"
              id="lecturer-password"
              name="password"
              placeholder="Nhập mật khẩu"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="lecturer-login__password-toggle"
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
          {error && <p className="lecturer-login__error" role="alert">{error}</p>}
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
          {isMockMode && (
            <small className="lecturer-login__hint">
              Mock: gv · mật khẩu 123456
            </small>
          )}
          <p className="lecturer-login__portal-link">
            Bạn là sinh viên? <Link to="/login">Chuyển sang Cổng sinh viên</Link>
          </p>
        </form>
      </section>
      </div>
    </main>
  )
}

export default LecturerLoginPage
