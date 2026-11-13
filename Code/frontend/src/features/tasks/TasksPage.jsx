import { useEffect, useState } from 'react'
import PageHeading from '../../components/PageHeading.jsx'
import teamApi from '../../api/teamApi.js'
import taskApi from '../../api/taskApi.js'
import {
  getTaskStatusLabel,
  isTaskOverdue,
} from './taskStatus.js'
import { useAuth } from '../../contexts/useAuth.js'
import { isStudentRole } from '../../utils/roles.js'

const taskStatuses = ['todo', 'in_progress', 'completed', 'cancelled']

function formatDate(value) {
  if (!value) {
    return 'Chưa đặt hạn'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Ngày không hợp lệ'
    : date.toLocaleString('vi-VN')
}

function TasksPage() {
  const { user, role } = useAuth()
  const [teams, setTeams] = useState([])
  const [teamId, setTeamId] = useState('')
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    teamApi
      .listTeams()
      .then((result) => {
        if (active) {
          setTeams(result)
          setTeamId(result[0] ? String(result[0].id) : '')
          if (!result.length) {
            setIsLoading(false)
          }
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || 'Không thể tải danh sách nhóm.')
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!teamId) {
      return undefined
    }

    let active = true
    Promise.all([
      taskApi.listTasks({ groupId: Number(teamId) }),
      teamApi.getTeam(teamId),
    ])
      .then(([taskList, team]) => {
        if (active) {
          setTasks(taskList)
          setMembers(team.members || [])
          setSelectedTeam(team)
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || 'Không thể tải nhiệm vụ.')
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
  }, [teamId])

  const canManageTasks =
    role === 'ADMIN' || selectedTeam?.leaderUserId === user?.id
  const canCreateTasks = canManageTasks || role === 'LECTURER'

  function canUpdateTaskStatus(task) {
    return (
      canManageTasks ||
      (isStudentRole(role) && Number(task.assignedTo) === Number(user?.id))
    )
  }

  async function handleCreateTask(event) {
    event.preventDefault()
    if (!teamId || !title.trim()) {
      setError('Chọn nhóm và nhập tên nhiệm vụ.')
      return
    }

    setIsSaving(true)
    setError('')
    try {
      await taskApi.createTask({
        groupId: Number(teamId),
        title: title.trim(),
        description: description.trim() || null,
        dueAt: dueAt || null,
        assignedTo: assignedTo ? Number(assignedTo) : null,
      })
      const updatedTasks = await taskApi.listTasks({
        groupId: Number(teamId),
      })
      setTasks(updatedTasks)
      setTitle('')
      setDescription('')
      setDueAt('')
      setAssignedTo('')
    } catch (saveError) {
      setError(saveError.message || 'Không thể tạo nhiệm vụ.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleStatusChange(taskId, status) {
    setError('')
    try {
      await taskApi.updateTaskStatus(taskId, status)
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId ? { ...task, status } : task,
        ),
      )
    } catch (updateError) {
      setError(updateError.message || 'Không thể cập nhật trạng thái.')
    }
  }

  async function handleDeleteTask(taskId) {
    setError('')
    try {
      await taskApi.deleteTask(taskId)
      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId),
      )
    } catch (deleteError) {
      setError(deleteError.message || 'Không thể xóa nhiệm vụ.')
    }
  }

  return (
    <section className="dashboard-page">
      <PageHeading
        title="Nhiệm vụ"
        description="Tạo nhiệm vụ, giao thành viên và cập nhật tiến độ thực hiện."
        status={isLoading ? 'Đang tải' : `${tasks.length} nhiệm vụ`}
      />
      {error && <p className="alert-error" role="alert">{error}</p>}
      {teams.length > 0 && (
        <label className="field-control">
          Nhóm
          <select
            value={teamId}
            onChange={(event) => {
              setIsLoading(true)
              setError('')
              setSelectedTeam(null)
              setTeamId(event.target.value)
            }}
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.groupName}
              </option>
            ))}
          </select>
        </label>
      )}
      {!isLoading && !teamId && (
        <section className="workspace-panel">Chưa có nhóm để quản lý nhiệm vụ.</section>
      )}
      {teamId && (
        <>
          {canCreateTasks && (
          <form className="workspace-panel data-form" onSubmit={handleCreateTask}>
            <h2>Tạo nhiệm vụ</h2>
            <label className="field-control">
              Tên nhiệm vụ
              <input
                onChange={(event) => setTitle(event.target.value)}
                required
                value={title}
              />
            </label>
            <label className="field-control">
              Mô tả
              <textarea
                onChange={(event) => setDescription(event.target.value)}
                rows="3"
                value={description}
              />
            </label>
            <div className="form-grid">
              <label className="field-control">
                Hạn hoàn thành
                <input
                  onChange={(event) => setDueAt(event.target.value)}
                  type="datetime-local"
                  value={dueAt}
                />
              </label>
              <label className="field-control">
                Giao cho
                <select
                  onChange={(event) => setAssignedTo(event.target.value)}
                  value={assignedTo}
                >
                  <option value="">Chưa phân công</option>
                  {members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.fullName}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button disabled={isSaving || isLoading} type="submit">
              {isSaving ? 'Đang lưu...' : 'Tạo nhiệm vụ'}
            </button>
          </form>
          )}

          <section className="task-list" aria-label="Danh sách nhiệm vụ">
            {isLoading ? (
              <p role="status">Đang tải nhiệm vụ...</p>
            ) : tasks.length ? (
              tasks.map((task) => (
                <article className="workspace-panel task-card" key={task.id}>
                  <div className="task-card-heading">
                    <div>
                      <p className="eyebrow">
                        {task.priority === 'high'
                          ? 'Ưu tiên cao'
                          : task.priority === 'low'
                            ? 'Ưu tiên thấp'
                            : 'Ưu tiên thường'}
                      </p>
                      <h2>{task.title}</h2>
                    </div>
                    {canUpdateTaskStatus(task) && task.status !== 'cancelled' ? <select
                      aria-label={`Trạng thái ${task.title}`}
                      onChange={(event) =>
                        handleStatusChange(task.id, event.target.value)
                      }
                      value={task.status}
                    >
                      {taskStatuses
                        .filter((status) => canManageTasks || status !== 'cancelled')
                        .map((status) => (
                        <option key={status} value={status}>
                          {getTaskStatusLabel(status)}
                        </option>
                      ))}
                    </select> : (
                      <span className="status-chip">
                        {getTaskStatusLabel(task.status)}
                      </span>
                    )}
                  </div>
                  {task.description && <p className="muted">{task.description}</p>}
                  <div className="task-meta">
                    <span>Phụ trách: {task.assigneeName || members.find((member) => member.userId === task.assignedTo)?.fullName || 'Chưa phân công'}</span>
                    <span className={isTaskOverdue(task) ? 'task-overdue' : ''}>
                      Hạn: {formatDate(task.dueAt)}
                      {isTaskOverdue(task) ? ' · Quá hạn' : ''}
                    </span>
                    {canManageTasks && <button
                      className="button-secondary"
                      onClick={() => handleDeleteTask(task.id)}
                      type="button"
                    >
                      Xóa
                    </button>}
                  </div>
                </article>
              ))
            ) : (
              <section className="workspace-panel">Nhóm chưa có nhiệm vụ.</section>
            )}
          </section>
        </>
      )}
    </section>
  )
}

export default TasksPage
