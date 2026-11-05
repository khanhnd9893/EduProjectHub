import StatCard from '../../components/StatCard.jsx'
import { useAuth } from '../../contexts/useAuth.js'

function DashboardPage() {
  const { user } = useAuth()

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Tổng quan</p>
          <h1>Xin chào, {user?.fullName}</h1>
          <p className="muted">Theo dõi tiến độ các mốc của đồ án.</p>
        </div>
        <span className="status-chip">Không gian làm việc</span>
      </div>
      <div className="stats-grid">
        <StatCard label="Đồ án đang thực hiện" value="1" detail="Học kỳ hiện tại" />
        <StatCard label="Nhiệm vụ đang mở" value="4" detail="2 nhiệm vụ trong tuần này" />
        <StatCard label="Mốc tiếp theo" value="12 ngày" detail="Chuẩn bị bảo vệ" />
      </div>
      <section className="workspace-panel">
        <p className="eyebrow">Đồ án hiện tại</p>
        <h2>Hệ thống quản lý đồ án sinh viên</h2>
        <p className="muted">
          Không gian đồ án đã sẵn sàng. Các module đồ án, nhiệm vụ, bài nộp và
          chatbot có thể được tích hợp tại đây.
        </p>
      </section>
    </section>
  )
}

export default DashboardPage
