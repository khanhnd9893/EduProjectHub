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
