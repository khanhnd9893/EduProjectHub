import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute.jsx'
import RoleRoute from '../components/RoleRoute.jsx'
import MainLayout from '../layouts/MainLayout.jsx'
import LoginPage from '../features/auth/LoginPage.jsx'
import LecturerLoginPage from '../features/auth/LecturerLoginPage.jsx'
import AdminLoginPage from '../features/auth/AdminLoginPage.jsx'
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
import TopicsPage from '../features/topics/TopicsPage.jsx'
import NotificationsPage from '../features/notifications/NotificationsPage.jsx'
// Hết khối M2

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/lecturer-login" element={<LecturerLoginPage />} />
      <Route path="/admin-login" element={<AdminLoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route
            path="/users"
            element={
              <RoleRoute resource="accounts">
                <UsersPage />
              </RoleRoute>
            }
          />
          <Route
            path="/topics"
            element={
              <RoleRoute resource="topics">
                <TopicsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/semesters"
            element={
              <RoleRoute resource="semesters">
                <SemestersPage />
              </RoleRoute>
            }
          />
          <Route element={<RoleRoute resource="project-work" />}>
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/grades" element={<GradesPage />} />
          </Route>
          <Route
            path="/chatbot"
            element={
              <RoleRoute resource="chatbot">
                <ChatbotPage />
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
