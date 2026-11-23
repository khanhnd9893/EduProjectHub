import { useEffect, useMemo, useState } from 'react'
import StatCard from '../../components/StatCard.jsx'
import teamApi from '../../api/teamApi.js'
import taskApi from '../../api/taskApi.js'
import topicApi from '../../api/topicApi.js'
import semesterApi from '../../api/semesterApi.js'
import usersApi from '../../api/usersApi.js'
import { useAuth } from '../../contexts/useAuth.js'
import { isStudentRole } from '../../utils/roles.js'

const openTaskStatuses = ['todo', 'in_progress']
const activeRoundStatuses = ['open', 'in_progress']
const DAY_MS = 24 * 60 * 60 * 1000

function getLocalDayTimestamp(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function formatDeadline(value, now = new Date()) {
  if (!value) return { date: 'Chưa có hạn', detail: 'Chưa có hạn', tone: 'neutral' }

  const dueDate = new Date(value)
  if (Number.isNaN(dueDate.getTime())) {
    return { date: 'Chưa có hạn', detail: 'Chưa có hạn', tone: 'neutral' }
  }

  const dayDifference = Math.round(
    (getLocalDayTimestamp(dueDate) - getLocalDayTimestamp(now)) / DAY_MS,
  )
  const dateLabel = dueDate.toLocaleDateString('vi-VN')

  if (dayDifference < 0) {
    return {
      date: dateLabel,
      detail: `Quá hạn ${Math.abs(dayDifference)} ngày`,
      tone: 'danger',
    }
  }
  if (dayDifference === 0) {
    return { date: dateLabel, detail: 'Hôm nay', tone: 'danger' }
  }
  return {
    date: dateLabel,
    detail: `Còn ${dayDifference} ngày`,
    tone: dayDifference <= 3 ? 'warning' : 'neutral',
  }
}

function DashboardPage() {
  const { user, role } = useAuth()
  const [teams, setTeams] = useState([])
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [topics, setTopics] = useState([])
  const [semesters, setSemesters] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const isStudent = isStudentRole(role)
  const isLecturer = role === 'LECTURER'
  const isAdmin = role === 'ADMIN'
  const isTrainingManager = role === 'TRAINING_MANAGER'
  const isProjectRole = isStudent || isLecturer
  const isManagementRole = isAdmin || isTrainingManager

  useEffect(() => {
    let active = true
    async function loadDashboard() {
      setIsLoading(true)
      setError('')
      try {
        if (isProjectRole) {
          const teamList = await teamApi.listTeams()
          const taskLists = await Promise.all(
            teamList.map((team) => taskApi.listTasks({ groupId: team.id })),
          )
          if (active) {
            setTeams(teamList)
            setTasks(taskLists.flat())
          }
        } else if (isManagementRole) {
          const [topicList, semesterList, userList] = await Promise.all([
            topicApi.listTopics(),
            semesterApi.listSemesters(),
            isAdmin ? usersApi.listUsers() : Promise.resolve([]),
          ])
          if (active) {
            setTopics(topicList)
            setSemesters(semesterList)
            setUsers(userList)
          }
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
  }, [isAdmin, isManagementRole, isProjectRole])

  const openTasks = useMemo(
    () => tasks.filter((task) => openTaskStatuses.includes(task.status)),
    [tasks],
  )
  const nextTask = useMemo(
    () =>
      openTasks
        .filter((task) => task.dueAt)
        .toSorted((left, right) => new Date(left.dueAt) - new Date(right.dueAt))[0],
    [openTasks],
  )
  const deadline = formatDeadline(nextTask?.dueAt)
  const openTopics = topics.filter((topic) => topic.status === 'open')
  const activeRounds = semesters.filter((semester) =>
    activeRoundStatuses.includes(semester.status),
  )
  const workspace = isAdmin
    ? {
        eyebrow: 'Quản trị hệ thống',
        title: 'Trung tâm quản trị',
        description: 'Quản lý tài khoản và tra cứu dữ liệu đồ án toàn hệ thống.',
      }
    : isTrainingManager
      ? {
          eyebrow: 'Điều phối đồ án',
          title: 'Không gian điều phối',
          description: 'Theo dõi đề tài, đợt đồ án và các nghiệp vụ cần điều phối.',
        }
      : isLecturer
        ? {
            eyebrow: 'Đồ án được phân công',
            title: teams[0]?.groupName || 'Nhóm đang hướng dẫn',
            description:
              teams[0]?.description ||
              'Theo dõi nhóm, nhiệm vụ và tiến độ trong phạm vi được phân công.',
          }
        : {
            eyebrow: 'Không gian làm việc',
            title: teams[0]?.groupName || 'Chưa có nhóm đồ án',
            description:
              teams[0]?.description ||
              'Khi nhóm đồ án được tạo hoặc phân công, thông tin sẽ hiển thị tại đây.',
          }

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Tổng quan</p>
          <h1>Xin chào, {user?.fullName}</h1>
          <p className="muted">{workspace.description}</p>
        </div>
        <span className="status-chip">
          {isLoading ? 'Đang tải dữ liệu' : workspace.eyebrow}
        </span>
      </div>
      {error && <p className="alert-error" role="alert">{error}</p>}

      {isProjectRole ? (
        <div className="stats-grid">
          <StatCard
            label={isLecturer ? 'Nhóm được phân công' : 'Nhóm đồ án'}
            value={isLoading ? '…' : teams.length}
            detail={isLecturer ? 'Nhóm bạn đang hướng dẫn' : 'Nhóm bạn có thể truy cập'}
          />
          <StatCard
            label="Nhiệm vụ đang mở"
            value={isLoading ? '…' : openTasks.length}
            detail={isLecturer ? 'Trong các nhóm được phân công' : 'Chưa làm hoặc đang thực hiện'}
          />
          <StatCard
            label="Hạn gần nhất"
            value={isLoading ? '…' : deadline.date}
            detail={
              isLoading
                ? 'Đang tải hạn nhiệm vụ'
                : nextTask?.title
                  ? `${nextTask.title} · ${deadline.detail}`
                  : deadline.detail
            }
            detailTone={isLoading ? 'neutral' : deadline.tone}
          />
        </div>
      ) : (
        <div className={`stats-grid${isAdmin ? ' dashboard-stats-grid--four' : ''}`}>
          {isAdmin && (
            <StatCard
              label="Tài khoản"
              value={isLoading ? '…' : users.length}
              detail="Tổng số tài khoản trong hệ thống"
            />
          )}
          <StatCard
            label="Đề tài đang mở"
            value={isLoading ? '…' : openTopics.length}
            detail="Đề tài hiện nhận đăng ký"
          />
          <StatCard
            label="Đợt đồ án đang hoạt động"
            value={isLoading ? '…' : activeRounds.length}
            detail="Đang mở hoặc đang diễn ra"
          />
          <StatCard
            label="Tổng số đề tài"
            value={isLoading ? '…' : topics.length}
            detail="Đề tài có thể tra cứu"
          />
        </div>
      )}

      <section className="workspace-panel dashboard-workspace">
        <p className="eyebrow">{workspace.eyebrow}</p>
        <h2>{workspace.title}</h2>
        <p className="muted">{workspace.description}</p>
      </section>
    </section>
  )
}

export default DashboardPage
