import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth.js'

function ProtectedRoute() {
  const { user, isLoading, authError, retrySession } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <p role="status">Đang kiểm tra phiên đăng nhập...</p>
  }

  if (authError) {
    return (
      <section className="auth-page">
        <p className="alert-error" role="alert">{authError}</p>
        <button onClick={retrySession} type="button">Thử kết nối lại</button>
      </section>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export default ProtectedRoute
