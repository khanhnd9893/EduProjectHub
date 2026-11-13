import apiClient from './client.js'
import { unwrap } from './response.js'

function mapUser(user) {
  return {
    id: Number(user.id),
    username: user.username,
    studentCode: user.student_code,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    department: user.department,
    role: user.role,
    accountStatus: user.account_status,
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  }
}

function toBackendUser(user) {
  return {
    username: user.username,
    student_code: user.studentCode || null,
    full_name: user.fullName,
    email: user.email,
    phone: user.phone || null,
    department: user.department || null,
    role: user.role,
    account_status: user.accountStatus,
  }
}

const userApi = {
  async listUsers(query = '') {
    const users = await unwrap(
      apiClient.get('/users.php', {
        params: { action: 'users', q: query.trim() || undefined },
      }),
    )
    return users.map(mapUser)
  },

  async createUser(user) {
    return mapUser(
      await unwrap(
        apiClient.post('/users.php?action=create', {
          ...toBackendUser(user),
          password: user.password,
        }),
      ),
    )
  },

  async updateUser(id, user) {
    const payload = {
      id: Number(id),
      ...toBackendUser(user),
    }
    if (user.password) {
      payload.password = user.password
    }

    return mapUser(
      await unwrap(apiClient.patch('/users.php?action=update', payload)),
    )
  },
}

export default userApi
