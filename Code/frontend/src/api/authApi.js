import apiClient from './client.js'
import { unwrap } from './response.js'

const mockUsers = {
  sv: { id: 1, fullName: 'Nguyễn Văn A', role: 'STUDENT' },
  gv: { id: 2, fullName: 'TS. Trần Thị B', role: 'LECTURER' },
  admin: { id: 3, fullName: 'Quản trị viên', role: 'ADMIN' },
}

const authApi = {
  async login({ username, password }) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const user = mockUsers[username]

      if (!user || password !== '123456') {
        throw new Error('Sai tài khoản hoặc mật khẩu')
      }

      return { token: 'mock-token', user }
    }

    return unwrap(
      apiClient.post('/auth.php?action=login', { username, password }),
    )
  },

  async getCurrentUser() {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      return JSON.parse(localStorage.getItem('user') || 'null')
    }

    return unwrap(apiClient.get('/auth.php?action=me'))
  },

  async logout() {
    if (import.meta.env.VITE_USE_MOCK !== 'true') {
      await unwrap(apiClient.post('/auth.php?action=logout', {}))
    }
  },
}

export default authApi
