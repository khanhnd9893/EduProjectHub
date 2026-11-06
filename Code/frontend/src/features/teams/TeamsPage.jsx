import { useEffect, useState } from 'react'
import PageHeading from '../../components/PageHeading.jsx'
import teamApi from '../../api/teamApi.js'
import { useAuth } from '../../contexts/useAuth.js'

const groupStatuses = {
  forming: 'Đang thành lập',
  active: 'Đang hoạt động',
  completed: 'Đã hoàn thành',
  dissolved: 'Đã giải tán',
}

function TeamsPage() {
  const { user, role } = useAuth()
  const [teams, setTeams] = useState([])
  const [selectedTeamId, setSelectedTeamId] = useState(null)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [isLoadingTeams, setIsLoadingTeams] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [availableStudents, setAvailableStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [groupCode, setGroupCode] = useState('')
  const [groupName, setGroupName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  async function refreshTeams() {
    const result = await teamApi.listTeams()
    setTeams(result)
    return result
  }

  useEffect(() => {
    let isCurrent = true

    async function loadTeams() {
      setIsLoadingTeams(true)
      setError('')
      try {
        const result = await teamApi.listTeams()
        if (isCurrent) {
          setTeams(result)
          setSelectedTeamId((currentId) =>
            result.some((team) => team.id === currentId)
              ? currentId
              : (result[0]?.id ?? null),
          )
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(loadError.message || 'Không thể tải danh sách nhóm.')
        }
      } finally {
        if (isCurrent) {
          setIsLoadingTeams(false)
        }
      }
    }

    loadTeams()
    return () => {
      isCurrent = false
    }
  }, [])

  useEffect(() => {
    if (selectedTeamId === null) {
      return undefined
    }

    let isCurrent = true
    teamApi
      .getTeam(selectedTeamId)
      .then((team) => {
        if (isCurrent) {
          setSelectedTeam(team)
        }
      })
      .catch((loadError) => {
        if (isCurrent) {
          setError(loadError.message || 'Không thể tải thông tin nhóm.')
        }
      })

    return () => {
      isCurrent = false
    }
  }, [selectedTeamId])

  const selectedLeader =
    selectedTeam?.members?.find((member) => member.memberRole === 'leader')
      ?.fullName || selectedTeam?.leaderName
  const isSelectedTeamLoading =
    selectedTeamId !== null && selectedTeam?.id !== selectedTeamId && !error

  async function handleCreateTeam(event) {
    event.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      const team = await teamApi.createTeam({
        groupCode: groupCode.trim(),
        groupName: groupName.trim(),
        description: description.trim(),
        projectRoundId: 1,
      })
      await refreshTeams()
      setSelectedTeamId(team.id)
      setIsCreating(false)
      setGroupCode('')
      setGroupName('')
      setDescription('')
    } catch (saveError) {
      setError(saveError.message || 'Không thể tạo nhóm.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRemoveMember(userId) {
    setError('')
    try {
      await teamApi.removeMember(selectedTeamId, userId)
      const updatedTeam = await teamApi.getTeam(selectedTeamId)
      setSelectedTeam(updatedTeam)
      await refreshTeams()
    } catch (removeError) {
      setError(removeError.message || 'Không thể xóa thành viên.')
    }
  }

  async function handleShowAddMember() {
    setError('')
    if (showAddMember) {
      setShowAddMember(false)
      return
    }

    setIsLoadingStudents(true)
    try {
      const students = await teamApi.listAvailableStudents(selectedTeamId)
      setAvailableStudents(students)
      setSelectedStudentId(students[0]?.id?.toString() || '')
      setShowAddMember(true)
    } catch (loadError) {
      setError(loadError.message || 'Không thể tải danh sách sinh viên.')
    } finally {
      setIsLoadingStudents(false)
    }
  }

  async function handleAddMember(event) {
    event.preventDefault()
    if (!selectedStudentId) {
      return
    }

    setError('')
    setIsAddingMember(true)
    try {
      await teamApi.addMember(selectedTeamId, Number(selectedStudentId))
      const [updatedTeam, students] = await Promise.all([
        teamApi.getTeam(selectedTeamId),
        teamApi.listAvailableStudents(selectedTeamId),
      ])
      setSelectedTeam(updatedTeam)
      setAvailableStudents(students)
      setSelectedStudentId(students[0]?.id?.toString() || '')
      await refreshTeams()
      if (students.length === 0) {
        setShowAddMember(false)
      }
    } catch (addError) {
      setError(addError.message || 'Không thể thêm sinh viên vào nhóm.')
    } finally {
      setIsAddingMember(false)
    }
  }

  return (
    <section className="dashboard-page">
      <PageHeading
        title="Nhóm đồ án"
        description="Danh sách nhóm và thông tin thành viên được tải từ API nhóm."
        status={isLoadingTeams ? 'Đang tải' : `${teams.length} nhóm`}
      />
      {role === 'STUDENT' && (
        <button
          className="teams-create-toggle"
          onClick={() => setIsCreating((current) => !current)}
          type="button"
        >
          {isCreating ? 'Đóng biểu mẫu' : 'Tạo nhóm'}
        </button>
      )}
      {error && (
        <p className="alert-error" role="alert">
          {error}
        </p>
      )}
      {isCreating && (
        <form className="workspace-panel data-form" onSubmit={handleCreateTeam}>
          <h2>Tạo nhóm đồ án</h2>
          <label className="field-control">
            Mã nhóm
            <input
              onChange={(event) => setGroupCode(event.target.value)}
              required
              value={groupCode}
            />
          </label>
          <label className="field-control">
            Tên nhóm
            <input
              onChange={(event) => setGroupName(event.target.value)}
              required
              value={groupName}
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
          <button disabled={isSaving} type="submit">
            {isSaving ? 'Đang tạo...' : 'Tạo nhóm'}
          </button>
        </form>
      )}
      {isLoadingTeams ? (
        <p className="teams-message" role="status">
          Đang tải danh sách nhóm...
        </p>
      ) : teams.length === 0 ? (
        <section className="workspace-panel teams-message">
          Chưa có nhóm nào để hiển thị.
        </section>
      ) : (
        <div className="teams-layout">
          <section className="teams-list" aria-label="Danh sách nhóm">
            {teams.map((team) => (
              <button
                className={`team-option${team.id === selectedTeamId ? ' is-selected' : ''}`}
                key={team.id}
                onClick={() => {
                  setError('')
                  setSelectedTeamId(team.id)
                }}
                type="button"
              >
                <span className="team-option-heading">
                  <strong>{team.groupName}</strong>
                  <span className="status-chip">
                    {groupStatuses[team.status] || team.status}
                  </span>
                </span>
                <span className="muted">
                  Mã nhóm: {team.groupCode || 'Chưa có'}
                </span>
                <span className="muted">
                  {team.roundName || `Đợt đồ án ${team.projectRoundId}`}
                </span>
              </button>
            ))}
          </section>

          <section className="workspace-panel team-details" aria-live="polite">
            {isSelectedTeamLoading ? (
              <p className="teams-message" role="status">
                Đang tải thông tin nhóm...
              </p>
            ) : selectedTeam?.id !== selectedTeamId ? (
              <p className="teams-message" role="alert">
                Không thể tải thông tin nhóm. Vui lòng chọn lại nhóm.
              </p>
            ) : (
              <>
                <p className="eyebrow">{selectedTeam.groupCode}</p>
                <h2>{selectedTeam.groupName}</h2>
                <p className="muted">
                  {selectedTeam.description || 'Nhóm chưa có mô tả.'}
                </p>
                <dl className="team-metadata">
                  <div>
                    <dt>Trạng thái</dt>
                    <dd>
                      {groupStatuses[selectedTeam.status] ||
                        selectedTeam.status}
                    </dd>
                  </div>
                  <div>
                    <dt>Trưởng nhóm</dt>
                    <dd>{selectedLeader || 'Chưa có thông tin'}</dd>
                  </div>
                  <div>
                    <dt>Số thành viên</dt>
                    <dd>{selectedTeam.members?.length ?? 0}</dd>
                  </div>
                </dl>
                <h3>Thành viên</h3>
                {selectedTeam.leaderUserId === user?.id &&
                  ['forming', 'active'].includes(selectedTeam.status) && (
                    <>
                      <button
                        className="button-secondary"
                        disabled={isLoadingStudents}
                        onClick={handleShowAddMember}
                        type="button"
                      >
                        {isLoadingStudents
                          ? 'Đang tải sinh viên...'
                          : showAddMember
                            ? 'Đóng thêm thành viên'
                            : 'Thêm sinh viên'}
                      </button>
                      {showAddMember && (
                        <form
                          className="data-form"
                          onSubmit={handleAddMember}
                        >
                          <label className="field-control">
                            Chọn sinh viên chưa thuộc nhóm trong đợt này
                            <select
                              onChange={(event) =>
                                setSelectedStudentId(event.target.value)
                              }
                              required
                              value={selectedStudentId}
                            >
                              {availableStudents.length === 0 ? (
                                <option value="">
                                  Không còn sinh viên phù hợp để thêm
                                </option>
                              ) : (
                                availableStudents.map((student) => (
                                  <option key={student.id} value={student.id}>
                                    {student.studentCode
                                      ? `${student.studentCode} - `
                                      : ''}
                                    {student.fullName}
                                  </option>
                                ))
                              )}
                            </select>
                          </label>
                          <button
                            disabled={
                              isAddingMember || availableStudents.length === 0
                            }
                            type="submit"
                          >
                            {isAddingMember ? 'Đang thêm...' : 'Thêm vào nhóm'}
                          </button>
                        </form>
                      )}
                    </>
                  )}
                {selectedTeam.members?.length ? (
                  <ul className="team-members">
                    {selectedTeam.members.map((member) => (
                      <li key={member.userId}>
                        <span>{member.fullName}</span>
                        <span className="muted">
                          {member.memberRole === 'leader'
                            ? 'Trưởng nhóm'
                            : 'Thành viên'}
                        </span>
                        {selectedTeam.leaderUserId === user?.id &&
                          member.userId !== selectedTeam.leaderUserId && (
                            <button
                              className="button-secondary"
                              onClick={() => handleRemoveMember(member.userId)}
                              type="button"
                            >
                              Xóa
                            </button>
                          )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Chưa có dữ liệu thành viên.</p>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </section>
  )
}

export default TeamsPage
