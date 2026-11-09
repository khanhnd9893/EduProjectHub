import PageHeading from '../../components/PageHeading.jsx'
import { useAuth } from '../../contexts/useAuth.js'

const roleLabels = {
  ADMIN: 'Quản trị viên',
  LECTURER: 'Giảng viên',
  STUDENT: 'Sinh viên',
}

function ProfilePage() {
  const { user } = useAuth()

  return (
    <section className="dashboard-page">
      <PageHeading
        eyebrow="Tài khoản"
        title="Hồ sơ cá nhân"
        description="Thông tin tài khoản đang đăng nhập trong hệ thống."
        status={roleLabels[user?.role] || user?.role || 'Chưa xác định'}
      />
      <section className="workspace-panel profile-panel">
        <div className="profile-summary">
          <div className="profile-avatar" aria-hidden="true">
            {(user?.fullName || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2>{user?.fullName || 'Chưa cập nhật họ tên'}</h2>
            <p className="muted">
              {roleLabels[user?.role] || 'Vai trò chưa được xác định'}
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
            <dd>{roleLabels[user?.role] || user?.role || 'Chưa có dữ liệu'}</dd>
          </div>
        </dl>
        <p className="profile-note">
          Thông tin hồ sơ được lấy từ phiên đăng nhập. Chức năng cập nhật sẽ
          được bật khi API tài khoản được bàn giao.
        </p>
      </section>
    </section>
  )
}

export default ProfilePage
