import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth.js'

function RoleRoute({ allowedRoles, children }) {
  const { role } = useAuth()

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children || <Outlet />
}

export default RoleRoute
