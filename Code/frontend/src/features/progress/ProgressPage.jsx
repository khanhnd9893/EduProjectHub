import { useEffect, useState } from 'react'
import PageHeading from '../../components/PageHeading.jsx'
import StatCard from '../../components/StatCard.jsx'
import progressApi from '../../api/progressApi.js'
import teamApi from '../../api/teamApi.js'

function ProgressPage() {
  const [teams, setTeams] = useState([])
  const [teamId, setTeamId] = useState('')
  const [progress, setProgress] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
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
    progressApi
      .getGroupProgress(Number(teamId))
      .then((result) => {
        if (active) {
          setProgress(result)
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || 'Không thể tải tiến độ nhóm.')
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

  const summary = progress?.summary

  return (
    <section className="dashboard-page">
      <PageHeading
        title="Tiến độ"
        description="Theo dõi tiến độ thực hiện và các nhiệm vụ quá hạn."
        status={isLoading ? 'Đang tải' : progress?.group.groupName || 'Chưa có nhóm'}
      />
      {error && <p className="alert-error" role="alert">{error}</p>}
      {teams.length > 0 && (
        <label className="field-control progress-team-select">
          Nhóm
          <select
            onChange={(event) => {
              setIsLoading(true)
              setError('')
              setTeamId(event.target.value)
            }}
            value={teamId}
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
        <section className="workspace-panel">Chưa có nhóm để theo dõi.</section>
      )}
      {isLoading ? (
        <p role="status">Đang tải số liệu tiến độ...</p>
      ) : summary ? (
        <>
          <div className="stats-grid">
            <StatCard label="Tổng nhiệm vụ" value={summary.totalTasks} detail="Trong nhóm" />
            <StatCard label="Đang thực hiện" value={summary.inProgressTasks} detail={`${summary.todoTasks} nhiệm vụ chưa bắt đầu`} />
            <StatCard label="Quá hạn" value={summary.overdueTasks} detail={`${summary.unassignedTasks} nhiệm vụ chưa giao`} />
          </div>
          <section className="workspace-panel progress-panel">
            <div className="progress-heading">
              <div>
                <p className="eyebrow">Tiến độ chung</p>
                <h2>{progress.group.groupName}</h2>
              </div>
              <strong>{summary.completionPercentage}%</strong>
            </div>
            <div
              aria-label={`Hoàn thành ${summary.completionPercentage}%`}
              aria-valuemax="100"
              aria-valuemin="0"
              aria-valuenow={summary.completionPercentage}
              className="progress-track"
              role="progressbar"
            >
              <span style={{ width: `${summary.completionPercentage}%` }} />
            </div>
            <p className="muted">
              {summary.completedTasks} hoàn thành · {summary.cancelledTasks} đã hủy
            </p>
          </section>
          <section className="workspace-panel member-progress-panel">
            <h2>Tiến độ theo thành viên</h2>
            {progress.members.length ? (
              <ul className="member-progress-list">
                {progress.members.map((member) => (
                  <li key={member.userId}>
                    <div className="member-progress-heading">
                      <strong>{member.fullName}</strong>
                      <span>{member.completedTasks}/{member.assignedTasks} hoàn thành</span>
                    </div>
                    <div className="progress-track">
                      <span
                        style={{
                          width: `${
                            member.assignedTasks - member.cancelledTasks > 0
                              ? (member.completedTasks /
                                  (member.assignedTasks -
                                    member.cancelledTasks)) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <small className="muted">
                      {member.overdueTasks} quá hạn · {member.inProgressTasks} đang làm
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Chưa có dữ liệu thành viên.</p>
            )}
          </section>
        </>
      ) : null}
    </section>
  )
}

export default ProgressPage
