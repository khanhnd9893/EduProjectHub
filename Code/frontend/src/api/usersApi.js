import { getMockUser, mockResolve, nextId } from './mock/helpers.js'

const mockUsers = [
  {
    id: 1,
    username: 'sv',
    fullName: 'Nguyễn Văn A',
    email: 'sv@example.test',
    phone: '',
    department: 'Công nghệ thông tin',
    studentCode: 'SV001',
    role: 'STUDENT',
    accountStatus: 'active',
  },
  {
    id: 2,
    username: 'gv',
    fullName: 'TS. Trần Thị B',
    email: 'gv@example.test',
    phone: '',
    department: 'Công nghệ thông tin',
    studentCode: '',
    role: 'LECTURER',
    accountStatus: 'active',
  },
  {
    id: 3,
    username: 'admin',
    fullName: 'Quản trị viên',
    email: 'admin@example.test',
    phone: '',
    department: 'Phòng đào tạo',
    studentCode: '',
    role: 'ADMIN',
    accountStatus: 'active',
  },
]

const roles = ['ADMIN', 'LECTURER', 'STUDENT']
const accountStatuses = ['active', 'locked', 'inactive']

function assertMockAdmin() {
  if (getMockUser().role !== 'ADMIN') {
    throw new Error('Chỉ quản trị viên mới được quản lý tài khoản.')
  }
}

function assertUnique(values, id = null) {
  const duplicate = mockUsers.find(
    (user) =>
      user.id !== Number(id) &&
      (user.username.toLowerCase() === values.username.trim().toLowerCase() ||
        user.email.toLowerCase() === values.email.trim().toLowerCase()),
  )
  if (duplicate) {
    throw new Error('Username hoặc email đã tồn tại.')
  }
}

function validate(values, id = null) {
  if (!values.username?.trim() || !values.fullName?.trim() || !values.email?.trim()) {
    throw new Error('Username, họ tên và email là bắt buộc.')
  }
  if (!roles.includes(values.role) || !accountStatuses.includes(values.accountStatus)) {
    throw new Error('Vai trò hoặc trạng thái tài khoản không hợp lệ.')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    throw new Error('Email không hợp lệ.')
  }
  assertUnique(values, id)
}

function unsupportedBackend() {
  // TODO: Chờ M3 triển khai API quản lý tài khoản trong users.php.
  throw new Error('Backend chưa hỗ trợ quản lý tài khoản. Vui lòng thử lại sau.')
}

const usersApi = {
  async listUsers() {
    assertMockAdmin()
    if (import.meta.env.VITE_USE_MOCK !== 'true') {
      unsupportedBackend()
    }
    return mockResolve(mockUsers)
  },

  async createUser(values) {
    assertMockAdmin()
    validate(values)
    if (import.meta.env.VITE_USE_MOCK !== 'true') {
      unsupportedBackend()
    }
    const user = {
      ...values,
      id: nextId(mockUsers),
      username: values.username.trim(),
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      accountStatus: 'active',
    }
    mockUsers.push(user)
    return mockResolve(user)
  },

  async updateUser(id, values) {
    assertMockAdmin()
    validate(values, id)
    if (import.meta.env.VITE_USE_MOCK !== 'true') {
      unsupportedBackend()
    }
    const index = mockUsers.findIndex((user) => user.id === Number(id))
    if (index === -1) {
      throw new Error('Không tìm thấy tài khoản.')
    }
    mockUsers[index] = { ...mockUsers[index], ...values }
    return mockResolve(mockUsers[index])
  },

  async updateStatus(id, accountStatus) {
    assertMockAdmin()
    const currentUser = getMockUser()
    if (Number(id) === Number(currentUser.id)) {
      throw new Error('Không thể khóa hoặc vô hiệu hóa chính tài khoản đang đăng nhập.')
    }
    if (!accountStatuses.includes(accountStatus)) {
      throw new Error('Trạng thái tài khoản không hợp lệ.')
    }
    if (import.meta.env.VITE_USE_MOCK !== 'true') {
      unsupportedBackend()
    }
    const user = mockUsers.find((entry) => entry.id === Number(id))
    if (!user) {
      throw new Error('Không tìm thấy tài khoản.')
    }
    user.accountStatus = accountStatus
    return mockResolve(user)
  },

  async resetPassword(id) {
    assertMockAdmin()
    if (import.meta.env.VITE_USE_MOCK !== 'true') {
      unsupportedBackend()
    }
    const user = mockUsers.find((entry) => entry.id === Number(id))
    if (!user) {
      throw new Error('Không tìm thấy tài khoản.')
    }
    const temporaryPassword = `Edu${Math.random().toString(36).slice(2, 8)}!`
    return mockResolve({ userId: user.id, temporaryPassword })
  },
}

export default usersApi
