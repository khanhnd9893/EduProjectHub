import apiClient from './client.js'
import { unwrap } from './response.js'
import { isMockMode } from '../config/runtime.js'
import { getMockUser, mockResolve } from './mock/helpers.js'

const mockProfiles = new Map()

function getProfile(user) {
  return {
    id: Number(user.id),
    username: user.username || '',
    fullName: user.fullName || user.full_name || '',
    email: user.email || '',
    phone: user.phone || '',
    department: user.department || '',
    studentCode: user.studentCode || user.student_code || '',
    avatarUrl: user.avatarUrl || user.avatar_url || '',
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
    if (isMockMode) {
      const user = getMockUser()
      return mockResolve(mockProfiles.get(Number(user.id)) || getProfile(user))
    }

    const data = await unwrap(apiClient.get('/auth.php', { params: { action: 'profile' } }))
    return getProfile(data)
  },

  async updateProfile(values) {
    validateProfile(values)

    if (isMockMode) {
      const user = getMockUser()
      const profile = {
        ...getProfile(user),
        ...values,
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() || '',
        department: values.department?.trim() || '',
        studentCode: values.studentCode?.trim() || '',
      }
      mockProfiles.set(profile.id, profile)
      return mockResolve(profile)
    }

    const payload = {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone?.trim() || '',
      department: values.department?.trim() || '',
      studentCode: values.studentCode?.trim() || '',
      avatarUrl: values.avatarUrl?.trim() || '',
    }

    const data = await unwrap(apiClient.patch('/auth.php?action=profile', payload))
    return getProfile(data)
  },

  async changePassword({ currentPassword, newPassword, confirmPassword }) {
    if (!currentPassword) {
      throw new Error('Vui lòng nhập mật khẩu hiện tại.')
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự.')
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      throw new Error('Mật khẩu xác nhận không khớp.')
    }

    if (isMockMode) {
      if (currentPassword !== '123456') {
        throw new Error('Mật khẩu hiện tại không chính xác.')
      }
      return mockResolve({ message: 'Đổi mật khẩu thành công.' })
    }

    return unwrap(
      apiClient.post('/auth.php?action=change_password', {
        currentPassword,
        newPassword,
        confirmPassword,
      }),
    )
  },
}

export default profileApi
