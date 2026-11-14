import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth.js'
import { canAccessPage } from '../utils/roles.js'

function RoleRoute({ resource, children }) {
  const { role } = useAuth()

  if (!canAccessPage(role, resource)) {
    return <Navigate to="/dashboard" replace />
  }

  return children || <Outlet />
}

export default RoleRoute
