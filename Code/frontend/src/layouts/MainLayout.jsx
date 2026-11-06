import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth.js'

function MainLayout() {
  const { user, role, logout } = useAuth()
  const [error, setError] = useState('')

  async function handleLogout() {
    setError('')
    try {
      await logout()
    } catch (logoutError) {
      setError(logoutError.message || 'Không thể đăng xuất khỏi backend.')
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/dashboard">
          Quản lý đồ án
        </NavLink>
        <nav className="main-nav" aria-label="Điều hướng chính">
          <NavLink to="/dashboard">Tổng quan</NavLink>
          {role === 'ADMIN' && <NavLink to="/semesters">Học kỳ</NavLink>}
          {/* M2: menu FR04-FR07, chỉ cho STUDENT và LECTURER */}
          {(role === 'STUDENT' || role === 'LECTURER') && (
            <>
              <NavLink to="/teams">Nhóm</NavLink>
              <NavLink to="/tasks">Nhiệm vụ</NavLink>
              <NavLink to="/progress">Tiến độ</NavLink>
              <NavLink to="/reports">Báo cáo</NavLink>
              <NavLink to="/grades">Điểm số</NavLink>
              <NavLink to="/chatbot">Chatbot</NavLink>
            </>
          )}
          {/* Hết khối M2 */}
        </nav>
        <div className="account-actions">
          <span>{user?.fullName}</span>
          <span className="role-label">{role}</span>
          <button type="button" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </header>
      <main className="page-content">
        {error && <p className="alert-error" role="alert">{error}</p>}
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
