import { useEffect, useMemo, useState } from 'react'
import PageHeading from '../../components/PageHeading.jsx'
import usersApi from '../../api/usersApi.js'
import './users.css'

const roleLabels = {
  ADMIN: 'Quản trị viên',
  LECTURER: 'Giảng viên',
  STUDENT: 'Sinh viên',
}
const statusLabels = {
  active: 'Đang hoạt động',
  locked: 'Đã khóa',
  inactive: 'Đã vô hiệu hóa',
}
const emptyForm = {
  username: '',
  fullName: '',
  email: '',
  phone: '',
  department: '',
  studentCode: '',
  role: 'STUDENT',
  accountStatus: 'active',
}

function UsersPage() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingUser, setEditingUser] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [temporaryPassword, setTemporaryPassword] = useState('')

  useEffect(() => {
    usersApi
      .listUsers()
      .then(setUsers)
      .catch((loadError) => setError(loadError.message || 'Không thể tải tài khoản.'))
      .finally(() => setIsLoading(false))
  }, [])

  const visibleUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return users.filter((user) => {
      const matchesQuery =
        !normalizedQuery ||
        [user.username, user.fullName, user.email].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        )
      return (
        matchesQuery &&
        (roleFilter === 'all' || user.role === roleFilter) &&
        (statusFilter === 'all' || user.accountStatus === statusFilter)
      )
    })
  }, [query, roleFilter, statusFilter, users])

  function openCreateForm() {
    setEditingUser(null)
    setForm(emptyForm)
    setError('')
    setSuccess('')
  }

  function openEditForm(user) {
    setEditingUser(user)
    setForm({ ...user })
    setError('')
    setSuccess('')
  }

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setTemporaryPassword('')
    setIsSaving(true)
    try {
      const saved = editingUser
        ? await usersApi.updateUser(editingUser.id, form)
        : await usersApi.createUser(form)
      setUsers((current) =>
        editingUser
          ? current.map((user) => (user.id === saved.id ? saved : user))
          : [...current, saved],
      )
      setEditingUser(null)
      setForm(emptyForm)
      setSuccess(editingUser ? 'Đã cập nhật tài khoản.' : 'Đã tạo tài khoản.')
    } catch (saveError) {
      setError(saveError.message || 'Không thể lưu tài khoản.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleStatusChange() {
    if (!statusTarget) return
    setError('')
    setIsSaving(true)
    const nextStatus = statusTarget.accountStatus === 'active' ? 'locked' : 'active'
    try {
      const saved = await usersApi.updateStatus(statusTarget.id, nextStatus)
      setUsers((current) => current.map((user) => (user.id === saved.id ? saved : user)))
      setSuccess(nextStatus === 'locked' ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.')
      setStatusTarget(null)
    } catch (statusError) {
      setError(statusError.message || 'Không thể đổi trạng thái tài khoản.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleResetPassword(user) {
    setError('')
    setTemporaryPassword('')
    try {
      const result = await usersApi.resetPassword(user.id)
      setTemporaryPassword(`${user.username}: ${result.temporaryPassword}`)
    } catch (resetError) {
      setError(resetError.message || 'Không thể reset mật khẩu.')
    }
  }

  return (
    <section className="dashboard-page">
      <PageHeading eyebrow="Quản trị" title="Quản lý tài khoản" description="Tạo và quản lý tài khoản người dùng." status="Chỉ ADMIN" />
      {error && <p className="alert-error" role="alert">{error}</p>}
      {success && <p className="success-message" role="status">{success}</p>}
      {temporaryPassword && (
        <p className="users-one-time-password" role="status">
          Mật khẩu tạm thời (chỉ hiển thị lần này): <strong>{temporaryPassword}</strong>
        </p>
      )}
      <button type="button" onClick={openCreateForm}>Thêm tài khoản</button>
      {(editingUser || form === emptyForm) && (
        <form className="workspace-panel data-form users-form" onSubmit={handleSubmit}>
          <div className="users-form-heading">
            <h2>{editingUser ? 'Chỉnh sửa tài khoản' : 'Tạo tài khoản'}</h2>
            <button className="button-secondary" type="button" onClick={() => setEditingUser(null)}>Đóng</button>
          </div>
          <div className="form-grid">
            <label className="field-control">Username<input name="username" value={form.username} onChange={handleChange} required /></label>
            <label className="field-control">Họ và tên<input name="fullName" value={form.fullName} onChange={handleChange} required /></label>
            <label className="field-control">Email<input name="email" type="email" value={form.email} onChange={handleChange} required /></label>
            <label className="field-control">Số điện thoại<input name="phone" value={form.phone} onChange={handleChange} /></label>
            <label className="field-control">Khoa / đơn vị<input name="department" value={form.department} onChange={handleChange} /></label>
            <label className="field-control">Mã sinh viên<input name="studentCode" value={form.studentCode} onChange={handleChange} /></label>
            <label className="field-control">Vai trò<select name="role" value={form.role} onChange={handleChange}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            {editingUser && <label className="field-control">Trạng thái<select name="accountStatus" value={form.accountStatus} onChange={handleChange}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
          </div>
          <button type="submit" disabled={isSaving}>{isSaving ? 'Đang lưu...' : 'Lưu tài khoản'}</button>
        </form>
      )}
      <div className="users-toolbar">
        <label className="field-control">Tìm kiếm<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Username, họ tên, email" /></label>
        <label className="field-control">Vai trò<select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="all">Tất cả</option>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="field-control">Trạng thái<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Tất cả</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      {isLoading ? <p role="status">Đang tải tài khoản...</p> : (
        <section className="workspace-panel users-table-wrapper">
          <table className="users-table">
            <thead><tr><th>Tài khoản</th><th>Họ tên</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>{visibleUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.username}<br /><span className="muted">{user.email}</span></td>
                <td>{user.fullName}</td>
                <td>{roleLabels[user.role]}</td>
                <td>{statusLabels[user.accountStatus]}</td>
                <td><div className="users-actions">
                  <button className="button-secondary" type="button" onClick={() => openEditForm(user)}>Sửa</button>
                  <button className="button-secondary" type="button" onClick={() => setStatusTarget(user)}>{user.accountStatus === 'active' ? 'Khóa' : 'Mở khóa'}</button>
                  <button className="button-secondary" type="button" onClick={() => handleResetPassword(user)}>Reset mật khẩu</button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </section>
      )}
      {statusTarget && (
        <div className="users-modal-backdrop" role="presentation">
          <section className="workspace-panel users-modal" role="dialog" aria-modal="true" aria-labelledby="user-status-title">
            <h2 id="user-status-title">{statusTarget.accountStatus === 'active' ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?'}</h2>
            <p>Bạn có chắc muốn thay đổi trạng thái tài khoản <strong>{statusTarget.username}</strong> không?</p>
            <div className="users-modal-actions">
              <button className="button-secondary" type="button" disabled={isSaving} onClick={() => setStatusTarget(null)}>Hủy</button>
              <button type="button" disabled={isSaving} onClick={handleStatusChange}>{isSaving ? 'Đang lưu...' : 'Xác nhận'}</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

export default UsersPage
