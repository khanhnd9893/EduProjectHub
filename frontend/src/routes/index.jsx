import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute.jsx'
import RoleRoute from '../components/RoleRoute.jsx'
import MainLayout from '../layouts/MainLayout.jsx'
import LoginPage from '../features/auth/LoginPage.jsx'
import DashboardPage from '../features/dashboard/DashboardPage.jsx'
import SemestersPage from '../features/semesters/SemestersPage.jsx'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/semesters"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <SemestersPage />
              </RoleRoute>
            }
          />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default AppRoutes
