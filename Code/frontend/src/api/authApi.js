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

    throw new Error(
      'Backend PHP hiện chưa có endpoint đăng nhập. Hãy bật VITE_USE_MOCK hoặc triển khai API xác thực.',
    )
  },
}

export default authApi
