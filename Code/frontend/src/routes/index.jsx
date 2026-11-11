import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute.jsx'
import RoleRoute from '../components/RoleRoute.jsx'
import MainLayout from '../layouts/MainLayout.jsx'
import LoginPage from '../features/auth/LoginPage.jsx'
import ProfilePage from '../features/profile/ProfilePage.jsx'
import DashboardPage from '../features/dashboard/DashboardPage.jsx'
import SemestersPage from '../features/semesters/SemestersPage.jsx'
import UsersPage from '../features/users/UsersPage.jsx'
// M2: các trang FR04-FR07
import TeamsPage from '../features/teams/TeamsPage.jsx'
import TasksPage from '../features/tasks/TasksPage.jsx'
import ProgressPage from '../features/progress/ProgressPage.jsx'
import ReportsPage from '../features/reports/ReportsPage.jsx'
import GradesPage from '../features/grades/GradesPage.jsx'
import ChatbotPage from '../features/chatbot/ChatbotPage.jsx'
// Hết khối M2

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="/semesters"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <SemestersPage />
              </RoleRoute>
            }
          />
          <Route
            path="/users"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <UsersPage />
              </RoleRoute>
            }
          />
          {/* M2: route FR04-FR07, chỉ cho STUDENT và LECTURER */}
          <Route element={<RoleRoute allowedRoles={['STUDENT', 'LECTURER']} />}>
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/grades" element={<GradesPage />} />
            <Route path="/chatbot" element={<ChatbotPage />} />
          </Route>
          {/* Hết khối M2 */}
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default AppRoutes
