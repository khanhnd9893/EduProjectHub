import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth.js'

function MainLayout() {
  const { user, role, logout } = useAuth()

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/dashboard">
          Quản lý đồ án
        </NavLink>
        <nav className="main-nav" aria-label="Điều hướng chính">
          <NavLink to="/dashboard">Tổng quan</NavLink>
          {role === 'ADMIN' && <NavLink to="/semesters">Học kỳ</NavLink>}
        </nav>
        <div className="account-actions">
          <span>{user?.fullName}</span>
          <span className="role-label">{role}</span>
          <button type="button" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </header>
      <main className="page-content">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
