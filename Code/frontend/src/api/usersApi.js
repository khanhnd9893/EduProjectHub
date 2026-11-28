import { getMockUser, mockResolve, nextId } from './mock/helpers.js'
import userApi from './userApi.js'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

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

const roles = [
  'ADMIN',
  'STUDENT',
  'TEAM_LEADER',
  'LECTURER',
  'TRAINING_MANAGER',
]
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
  if (['STUDENT', 'TEAM_LEADER'].includes(values.role) && !values.studentCode?.trim()) {
    throw new Error('Sinh viên và trưởng nhóm phải có mã sinh viên.')
  }
  if (id === null && (!values.password || values.password.length < 8)) {
    throw new Error('Mật khẩu phải có ít nhất 8 ký tự.')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    throw new Error('Email không hợp lệ.')
  }
  assertUnique(values, id)
}

function generateTemporaryPassword() {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return `Edu${Array.from(bytes, (byte) => (byte % 36).toString(36)).join('').slice(0, 8)}!`
}

async function callRealApi(request) {
  try {
    return await request()
  } catch (error) {
    if (!error.cause?.response) {
      throw new Error('Không thể kết nối tới máy chủ. Vui lòng kiểm tra backend và mạng.', {
        cause: error,
      })
    }
    throw error
  }
}

const usersApi = {
  async listUsers() {
    if (!useMock) {
      return callRealApi(() => userApi.listUsers())
    }
    assertMockAdmin()
    return mockResolve(mockUsers)
  },

  async createUser(values) {
    if (!useMock) {
      const user = await callRealApi(() =>
        userApi.createUser(values),
      )
      return user
    }
    assertMockAdmin()
    validate(values)
    const user = {
      ...values,
      id: nextId(mockUsers),
      username: values.username.trim(),
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone?.trim() || '',
      department: values.department?.trim() || '',
      studentCode: ['STUDENT', 'TEAM_LEADER'].includes(values.role)
        ? values.studentCode?.trim() || ''
        : '',
      accountStatus: 'active',
    }
    mockUsers.push(user)
    return mockResolve(user)
  },

  async updateUser(id, values) {
    if (!useMock) {
      return callRealApi(() => userApi.updateUser(id, values))
    }
    assertMockAdmin()
    validate(values, id)
    const index = mockUsers.findIndex((user) => user.id === Number(id))
    if (index === -1) {
      throw new Error('Không tìm thấy tài khoản.')
    }
    mockUsers[index] = { ...mockUsers[index], ...values }
    return mockResolve(mockUsers[index])
  },

  async updateStatus(id, accountStatus) {
    if (!useMock) {
      return callRealApi(() => userApi.updateStatus(id, accountStatus))
    }
    assertMockAdmin()
    const currentUser = getMockUser()
    if (Number(id) === Number(currentUser.id)) {
      throw new Error('Không thể khóa hoặc vô hiệu hóa chính tài khoản đang đăng nhập.')
    }
    if (!accountStatuses.includes(accountStatus)) {
      throw new Error('Trạng thái tài khoản không hợp lệ.')
    }
    const user = mockUsers.find((entry) => entry.id === Number(id))
    if (!user) {
      throw new Error('Không tìm thấy tài khoản.')
    }
    user.accountStatus = accountStatus
    return mockResolve(user)
  },

  async resetPassword(id) {
    if (!useMock) {
      const temporaryPassword = generateTemporaryPassword()
      await callRealApi(() => userApi.updatePassword(id, temporaryPassword))
      return { userId: Number(id), temporaryPassword }
    }
    assertMockAdmin()
    const user = mockUsers.find((entry) => entry.id === Number(id))
    if (!user) {
      throw new Error('Không tìm thấy tài khoản.')
    }
    const temporaryPassword = generateTemporaryPassword()
    return mockResolve({ userId: user.id, temporaryPassword })
  },
}

export default usersApi
