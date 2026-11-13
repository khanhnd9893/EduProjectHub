import { useEffect, useState } from 'react'
import PageHeading from '../../components/PageHeading.jsx'
import { useAuth } from '../../contexts/useAuth.js'
import profileApi from '../../api/profileApi.js'
import './profile-edit.css'

import { roleLabel } from '../../utils/roles.js'

function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    studentCode: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    profileApi
      .getProfile()
      .then((profile) => {
        if (active) {
          setForm({
            fullName: profile.fullName,
            email: profile.email,
            phone: profile.phone,
            department: profile.department,
            studentCode: profile.studentCode,
          })
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || 'Không thể tải hồ sơ.')
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

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSaving(true)
    try {
      const profile = await profileApi.updateProfile(form)
      updateUser({ ...user, ...profile })
      setSuccess('Đã cập nhật hồ sơ.')
    } catch (saveError) {
      setError(saveError.message || 'Không thể cập nhật hồ sơ.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="dashboard-page">
      <PageHeading
        eyebrow="Tài khoản"
        title="Hồ sơ cá nhân"
        description="Thông tin tài khoản đang đăng nhập trong hệ thống."
        status={roleLabel(user?.role) || 'Chưa xác định'}
      />
      {error && <p className="alert-error" role="alert">{error}</p>}
      {success && <p className="success-message" role="status">{success}</p>}
      <section className="workspace-panel profile-panel">
        <div className="profile-summary">
          <div className="profile-avatar" aria-hidden="true">
            {(user?.fullName || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2>{user?.fullName || 'Chưa cập nhật họ tên'}</h2>
            <p className="muted">
              {roleLabel(user?.role) || 'Vai trò chưa được xác định'}
            </p>
          </div>
        </div>
        <dl className="profile-metadata">
          <div>
            <dt>Tên tài khoản</dt>
            <dd>{user?.username || 'Chưa có dữ liệu'}</dd>
          </div>
          <div>
            <dt>Họ và tên</dt>
            <dd>{user?.fullName || 'Chưa có dữ liệu'}</dd>
          </div>
          <div>
            <dt>Vai trò</dt>
            <dd>{roleLabel(user?.role) || 'Chưa có dữ liệu'}</dd>
          </div>
        </dl>
        <form className="profile-edit-form" onSubmit={handleSubmit}>
          <h2>Cập nhật hồ sơ</h2>
          {isLoading ? (
            <p role="status">Đang tải hồ sơ...</p>
          ) : (
            <>
              <div className="form-grid">
                <label className="field-control">
                  Họ và tên
                  <input name="fullName" value={form.fullName} onChange={handleChange} required />
                </label>
                <label className="field-control">
                  Email
                  <input name="email" type="email" value={form.email} onChange={handleChange} required />
                </label>
                <label className="field-control">
                  Số điện thoại
                  <input name="phone" value={form.phone} onChange={handleChange} />
                </label>
                <label className="field-control">
                  Khoa / đơn vị
                  <input name="department" value={form.department} onChange={handleChange} />
                </label>
                <label className="field-control">
                  Mã sinh viên
                  <input name="studentCode" value={form.studentCode} onChange={handleChange} />
                </label>
              </div>
              <div className="profile-edit-actions">
                <button type="submit" disabled={isSaving}>
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </>
          )}
        </form>
      </section>
    </section>
  )
}

export default ProfilePage
