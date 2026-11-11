import { getMockUser, mockResolve } from './mock/helpers.js'

const mockProfiles = new Map()

function getProfile(user) {
  return {
    id: Number(user.id),
    username: user.username || '',
    fullName: user.fullName || '',
    email: user.email || '',
    phone: user.phone || '',
    department: user.department || '',
    studentCode: user.studentCode || '',
    role: user.role,
  }
}

function validateProfile(values) {
  if (!values.fullName?.trim()) {
    throw new Error('Họ và tên là bắt buộc.')
  }
  if (!values.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    throw new Error('Vui lòng nhập email hợp lệ.')
  }
  if (values.phone && !/^[0-9+()\s-]{8,15}$/.test(values.phone)) {
    throw new Error('Số điện thoại không hợp lệ.')
  }
}

const profileApi = {
  async getProfile() {
    const user = getMockUser()
    return mockResolve(mockProfiles.get(Number(user.id)) || getProfile(user))
  },

  async updateProfile(values) {
    validateProfile(values)
    const user = getMockUser()
    const profile = {
      ...getProfile(user),
      ...values,
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      department: values.department.trim(),
      studentCode: values.studentCode.trim(),
    }

    if (import.meta.env.VITE_USE_MOCK !== 'true') {
      // TODO: Chờ M3 triển khai PATCH /auth.php?action=profile.
      throw new Error('Backend chưa hỗ trợ cập nhật hồ sơ. Vui lòng thử lại sau.')
    }

    mockProfiles.set(profile.id, profile)
    return mockResolve(profile)
  },
}

export default profileApi
