import { useEffect, useState } from 'react'
import PageHeading from '../../components/PageHeading.jsx'
import { useAuth } from '../../contexts/useAuth.js'
import profileApi, { PASSWORD_MIN_LENGTH } from '../../api/profileApi.js'
import { isStudentRole } from '../../utils/roles.js'
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
    avatarUrl: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

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
            avatarUrl: profile.avatarUrl,
          })
        }
      })
      .catch((loadError) => {
        if (active) {
          setProfileError(getErrorMessage(loadError, 'Không thể tải hồ sơ.'))
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
    setProfileError('')
    setProfileSuccess('')
    setIsSaving(true)
    try {
      const profile = await profileApi.updateProfile(form)
      updateUser({ ...user, ...profile })
      setProfileSuccess('Đã cập nhật hồ sơ.')
    } catch (saveError) {
      setProfileError(getErrorMessage(saveError, 'Không thể cập nhật hồ sơ.'))
    } finally {
      setIsSaving(false)
    }

  }

  function handlePasswordChange(event) {
    setPasswordForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordError('Vui lòng nhập đầy đủ thông tin đổi mật khẩu.')
      return
    }
    if (passwordForm.newPassword.length < PASSWORD_MIN_LENGTH) {
      setPasswordError(
        `Mật khẩu mới phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`,
      )
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp.')
      return
    }
    if (passwordForm.newPassword === passwordForm.currentPassword) {
      setPasswordError('Mật khẩu mới phải khác mật khẩu hiện tại.')
      return
    }

    setIsChangingPassword(true)
    try {
      await profileApi.changePassword(passwordForm)
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setPasswordSuccess('Đã đổi mật khẩu thành công.')
    } catch (changeError) {
      setPasswordError(
        getErrorMessage(changeError, 'Không thể đổi mật khẩu.'),
      )
    } finally {
      setIsChangingPassword(false)
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
      {profileError && <p className="alert-error" role="alert">{profileError}</p>}
      {profileSuccess && <p className="success-message" role="status">{profileSuccess}</p>}
      <section className="workspace-panel profile-panel">
        <div className="profile-summary">
          {form.avatarUrl ? (
            <img className="profile-avatar profile-avatar-image" src={form.avatarUrl} alt="Ảnh đại diện" />
          ) : (
            <div className="profile-avatar" aria-hidden="true">
              {(form.fullName || user?.fullName || '?').charAt(0).toUpperCase()}
            </div>
          )}
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
                  URL ảnh đại diện
                  <input name="avatarUrl" type="url" value={form.avatarUrl} onChange={handleChange} placeholder="https://..." />
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
                {isStudentRole(user?.role) && (
                  <label className="field-control">
                    Mã sinh viên
                    <input name="studentCode" value={form.studentCode} readOnly />
                  </label>
                )}
              </div>
              <div className="profile-edit-actions">
                <button type="submit" disabled={isSaving}>
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </>
          )}
        </form>
        <form className="profile-edit-form password-form" onSubmit={handlePasswordSubmit}>
          <h2>Đổi mật khẩu</h2>
          {passwordError && <p className="alert-error" role="alert">{passwordError}</p>}
          {passwordSuccess && <p className="success-message" role="status">{passwordSuccess}</p>}
          <div className="form-grid">
            <label className="field-control">
              Mật khẩu hiện tại
              <input
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                autoComplete="current-password"
              />
            </label>
            <label className="field-control">
              Mật khẩu mới
              <input
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                autoComplete="new-password"
              />
            </label>
            <label className="field-control">
              Nhập lại mật khẩu mới
              <input
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                autoComplete="new-password"
              />
            </label>
          </div>
          <div className="profile-edit-actions">
            <button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </section>
    </section>
  )
}

function getErrorMessage(error, fallback) {
  if (!error?.cause?.response && error?.cause) {
    return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra backend và mạng.'
  }
  return error?.message || fallback
}

export default ProfilePage
