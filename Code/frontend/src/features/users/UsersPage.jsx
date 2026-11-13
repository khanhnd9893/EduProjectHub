import { Fragment, useEffect, useState } from 'react'
import PageHeading from '../../components/PageHeading.jsx'
import userApi from '../../api/userApi.js'
import { useAuth } from '../../contexts/useAuth.js'
import { roleLabel } from '../../utils/roles.js'

const accountRoles = [
  { value: 'admin', label: 'Quản trị viên' },
  { value: 'student', label: 'Sinh viên' },
  { value: 'team_leader', label: 'Trưởng nhóm' },
  { value: 'lecturer', label: 'Giảng viên' },
  { value: 'training_manager', label: 'Người đào tạo' },
]

const accountStatuses = [
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'locked', label: 'Đã khóa' },
  { value: 'inactive', label: 'Ngừng hoạt động' },
]

function createEmptyForm() {
  return {
    username: '',
    studentCode: '',
    fullName: '',
    email: '',
    phone: '',
    department: '',
    role: 'student',
    accountStatus: 'active',
    password: '',
  }
}

function formatLastLogin(value) {
  if (!value) {
    return 'Chưa đăng nhập'
  }
  const date = new Date(value.replace(' ', 'T'))
  return Number.isNaN(date.getTime())
    ? 'Không xác định'
    : date.toLocaleString('vi-VN')
}

function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState(createEmptyForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadUsers(query = '') {
    setError('')
    setIsLoading(true)
    try {
      setUsers(await userApi.listUsers(query))
    } catch (loadError) {
      setError(loadError.message || 'Không thể tải danh sách tài khoản.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    userApi
      .listUsers()
      .then((result) => {
        if (active) {
          setUsers(result)
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || 'Không thể tải danh sách tài khoản.')
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  function openCreateForm() {
    setEditingUser(null)
    setForm(createEmptyForm())
    setError('')
    setSuccess('')
    setIsFormOpen(true)
  }

  function openEditForm(user) {
    setEditingUser(user)
    setForm({
      username: user.username,
      studentCode: user.studentCode || '',
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      department: user.department || '',
      role: user.role,
      accountStatus: user.accountStatus,
      password: '',
    })
    setError('')
    setSuccess('')
    setIsFormOpen(true)
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSaving(true)

    try {
      const savedUser = editingUser
        ? await userApi.updateUser(editingUser.id, form)
        : await userApi.createUser(form)
      setIsFormOpen(false)
      setSuccess(
        editingUser
          ? `Đã cập nhật tài khoản ${savedUser.username}.`
          : `Đã tạo tài khoản ${savedUser.username}.`,
      )
      await loadUsers(search)
    } catch (saveError) {
      setError(saveError.message || 'Không thể lưu tài khoản.')
    } finally {
      setIsSaving(false)
    }
  }

  const requiresStudentCode = ['student', 'team_leader'].includes(form.role)
  const isEditingCurrentUser =
    editingUser !== null && Number(editingUser.id) === Number(currentUser?.id)

  function renderAccountForm(isInline = false) {
    return (
      <form
        className={`workspace-panel data-form account-form${isInline ? ' account-form-inline' : ''}`}
        onSubmit={handleSubmit}
      >
        <div className="semester-form-heading">
          <h2>{editingUser ? 'Cập nhật tài khoản' : 'Tạo tài khoản mới'}</h2>
          <button
            className="button-secondary"
            onClick={() => setIsFormOpen(false)}
            type="button"
          >
            Đóng
          </button>
        </div>
        <div className="form-grid">
          <label className="field-control">
            Tên đăng nhập
            <input
              autoComplete="username"
              maxLength="50"
              minLength="3"
              name="username"
              required
              value={form.username}
              onChange={handleChange}
            />
          </label>
          <label className="field-control">
            Họ và tên
            <input
              maxLength="150"
              name="fullName"
              required
              value={form.fullName}
              onChange={handleChange}
            />
          </label>
          <label className="field-control">
            Email
            <input
              autoComplete="email"
              maxLength="150"
              name="email"
              required
              type="email"
              value={form.email}
              onChange={handleChange}
            />
          </label>
          <label className="field-control">
            Mã sinh viên
            <input
              maxLength="30"
              name="studentCode"
              required={requiresStudentCode}
              value={form.studentCode}
              onChange={handleChange}
            />
          </label>
          <label className="field-control">
            Số điện thoại
            <input
              maxLength="15"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />
          </label>
          <label className="field-control">
            Khoa / đơn vị
            <input
              maxLength="100"
              name="department"
              value={form.department}
              onChange={handleChange}
            />
          </label>
          <label className="field-control">
            Vai trò
            <select
              disabled={isEditingCurrentUser}
              name="role"
              value={form.role}
              onChange={handleChange}
            >
              {accountRoles.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field-control">
            Trạng thái tài khoản
            <select
              disabled={isEditingCurrentUser}
              name="accountStatus"
              value={form.accountStatus}
              onChange={handleChange}
            >
              {accountStatuses.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field-control">
            {editingUser ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu khởi tạo'}
            <input
              autoComplete="new-password"
              minLength="8"
              name="password"
              required={!editingUser}
              type="password"
              value={form.password}
              onChange={handleChange}
            />
          </label>
        </div>
        {isEditingCurrentUser && (
          <p className="muted">
            Không thể tự đổi vai trò hoặc khóa tài khoản quản trị viên đang đăng nhập.
          </p>
        )}
        <button disabled={isSaving} type="submit">
          {isSaving ? 'Đang lưu...' : 'Lưu tài khoản'}
        </button>
      </form>
    )
  }

  return (
    <section className="dashboard-page">
      <PageHeading
        eyebrow="Quản trị viên"
        title="Quản lý tài khoản"
        description="Nhập thông tin thật, gán một trong năm vai trò và quản lý trạng thái truy cập."
        status={isLoading ? 'Đang tải' : `${users.length} tài khoản`}
      />

      <p className="muted">
        Mật khẩu được mã hóa trước khi lưu và không hiển thị trong danh sách.
        Vai trò Trưởng nhóm không cấp quyền quản lý nhóm khác; quyền trưởng
        nhóm được xác định riêng theo từng nhóm.
      </p>

      <div className="account-toolbar">
        <form
          className="account-search"
          onSubmit={(event) => {
            event.preventDefault()
            loadUsers(search)
          }}
        >
          <label className="field-control">
            Tìm tài khoản
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tên, email, tên đăng nhập hoặc mã sinh viên"
              value={search}
            />
          </label>
          <button className="button-secondary" type="submit">
            Tìm kiếm
          </button>
        </form>
        <button className="semester-create-button" onClick={openCreateForm} type="button">
          Thêm tài khoản
        </button>
      </div>

      {error && (
        <p className="alert-error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="success-message" role="status">
          {success}
        </p>
      )}

      {isFormOpen && !editingUser && renderAccountForm()}

      {isLoading ? (
        <p role="status">Đang tải tài khoản...</p>
      ) : users.length === 0 ? (
        <section className="workspace-panel teams-message">
          Không tìm thấy tài khoản phù hợp.
        </section>
      ) : (
        <div className="account-table-container">
          <table className="account-table">
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Liên hệ</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Đăng nhập gần nhất</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <Fragment key={user.id}>
                  <tr>
                    <td>
                      <strong>{user.fullName}</strong>
                      <span className="account-table-detail">
                        {user.username}
                        {user.studentCode ? ` · ${user.studentCode}` : ''}
                      </span>
                    </td>
                    <td>
                      {user.email}
                      {user.phone && (
                        <span className="account-table-detail">{user.phone}</span>
                      )}
                    </td>
                    <td>{roleLabel(user.role.toUpperCase())}</td>
                    <td>
                      {accountStatuses.find((status) => status.value === user.accountStatus)?.label}
                    </td>
                    <td>{formatLastLogin(user.lastLoginAt)}</td>
                    <td>
                      <button
                        className="button-secondary"
                        onClick={() => {
                          if (editingUser?.id === user.id && isFormOpen) {
                            setIsFormOpen(false)
                          } else {
                            openEditForm(user)
                          }
                        }}
                        type="button"
                      >
                        {editingUser?.id === user.id && isFormOpen
                          ? 'Đóng biểu mẫu'
                          : 'Sửa / phân quyền'}
                      </button>
                    </td>
                  </tr>
                  {isFormOpen && editingUser?.id === user.id && (
                    <tr>
                      <td colSpan="6">{renderAccountForm(true)}</td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default UsersPage
