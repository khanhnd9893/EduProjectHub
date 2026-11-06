import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import StatCard from '../../components/StatCard.jsx'
import teamApi from '../../api/teamApi.js'
import taskApi from '../../api/taskApi.js'
import { useAuth } from '../../contexts/useAuth.js'

function DashboardPage() {
  const { user } = useAuth()
  const [teams, setTeams] = useState([])
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function loadDashboard() {
      try {
        const teamList = await teamApi.listTeams()
        const taskLists = await Promise.all(
          teamList.map((team) => taskApi.listTasks({ groupId: team.id })),
        )
        if (active) {
          setTeams(teamList)
          setTasks(taskLists.flat())
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Không thể tải dữ liệu tổng quan.')
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadDashboard()
    return () => {
      active = false
    }
  }, [])

  const openTasks = useMemo(
    () => tasks.filter((task) => ['todo', 'in_progress'].includes(task.status)),
    [tasks],
  )
  const nextTask = useMemo(
    () =>
      openTasks
        .filter((task) => task.dueAt)
        .toSorted((left, right) => new Date(left.dueAt) - new Date(right.dueAt))[0],
    [openTasks],
  )
  const nextTaskDueDate = nextTask?.dueAt?.slice(0, 10)

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Tổng quan</p>
          <h1>Xin chào, {user?.fullName}</h1>
          <p className="muted">Theo dõi tiến độ các mốc của đồ án.</p>
        </div>
        <span className="status-chip">
          {isLoading ? 'Đang tải dữ liệu' : 'Không gian làm việc'}
        </span>
      </div>
      {error && <p className="alert-error" role="alert">{error}</p>}
      <div className="stats-grid">
        <StatCard
          label="Nhóm đồ án"
          value={isLoading ? '…' : teams.length}
          detail="Nhóm bạn có thể truy cập"
        />
        <StatCard
          label="Nhiệm vụ đang mở"
          value={isLoading ? '…' : openTasks.length}
          detail="Chưa làm hoặc đang thực hiện"
        />
        <StatCard
          label="Hạn gần nhất"
          value={
            isLoading
              ? '…'
              : nextTaskDueDate === undefined
                  ? '—'
                  : nextTaskDueDate
          }
          detail={nextTask?.title || 'Không có nhiệm vụ sắp đến hạn'}
        />
      </div>
      <section className="workspace-panel dashboard-workspace">
        <p className="eyebrow">Không gian làm việc</p>
        <h2>{teams[0]?.groupName || 'Chưa có nhóm đồ án'}</h2>
        <p className="muted">
          {teams[0]?.description ||
            'Khi nhóm đồ án được tạo hoặc phân công, thông tin sẽ hiển thị tại đây.'}
        </p>
        <nav className="dashboard-links" aria-label="Lối tắt">
          <NavLink to="/teams">Xem nhóm</NavLink>
          <NavLink to="/tasks">Quản lý nhiệm vụ</NavLink>
          <NavLink to="/progress">Theo dõi tiến độ</NavLink>
        </nav>
      </section>
    </section>
  )
}

export default DashboardPage
