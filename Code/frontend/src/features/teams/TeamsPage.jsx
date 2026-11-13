import { useEffect, useState } from 'react'
import PageHeading from '../../components/PageHeading.jsx'
import teamApi from '../../api/teamApi.js'
import { useAuth } from '../../contexts/useAuth.js'
import { isStudentRole } from '../../utils/roles.js'
import AddMemberForm from './AddMemberForm.jsx'
import InviteMemberForm from './InviteMemberForm.jsx'
import JoinRequestsPanel from './JoinRequestsPanel.jsx'
import MyInvitationsPanel from './MyInvitationsPanel.jsx'

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
  const [showAddMemberForm, setShowAddMemberForm] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
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
  const canManageSelectedTeam =
    isStudentRole(role) && selectedTeam?.leaderUserId === user?.id
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

  async function handleMemberAdded() {
    setSelectedTeam(await teamApi.getTeam(selectedTeamId))
    await refreshTeams()
  }

  async function handleRequestApproved() {
    setSelectedTeam(await teamApi.getTeam(selectedTeamId))
    await refreshTeams()
  }

  async function handleInvitationAccepted(groupId) {
    const [, joinedTeam] = await Promise.all([
      refreshTeams(),
      teamApi.getTeam(groupId),
    ])
    setSelectedTeam(joinedTeam)
    setSelectedTeamId(groupId)
  }

  return (
    <section className="dashboard-page">
      <PageHeading
        title="Nhóm đồ án"
        description="Danh sách nhóm và thông tin thành viên được tải từ API nhóm."
        status={isLoadingTeams ? 'Đang tải' : `${teams.length} nhóm`}
      />
      {isStudentRole(role) && (
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
      {isStudentRole(role) && (
        <MyInvitationsPanel onAccepted={handleInvitationAccepted} />
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
                  setShowAddMemberForm(false)
                  setShowInviteForm(false)
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
                {canManageSelectedTeam &&
                  ['forming', 'active'].includes(selectedTeam.status) && (
                    <>
                      <button
                        className="button-secondary"
                        onClick={() => {
                          setShowAddMemberForm((current) => !current)
                          setShowInviteForm(false)
                        }}
                        type="button"
                      >
                        {showAddMemberForm ? 'Đóng thêm thành viên' : 'Thêm trực tiếp'}
                      </button>
                      <button
                        className="button-secondary"
                        onClick={() => {
                          setShowInviteForm((current) => !current)
                          setShowAddMemberForm(false)
                        }}
                        type="button"
                      >
                        {showInviteForm ? 'Đóng mời thành viên' : 'Mời thành viên'}
                      </button>
                      {showAddMemberForm && (
                        <AddMemberForm
                          onAdded={handleMemberAdded}
                          teamId={selectedTeam.id}
                        />
                      )}
                      {showInviteForm && (
                        <InviteMemberForm teamId={selectedTeam.id} />
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
                        {canManageSelectedTeam &&
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
                {canManageSelectedTeam &&
                  ['forming', 'active'].includes(selectedTeam.status) && (
                    <JoinRequestsPanel
                      key={selectedTeam.id}
                      onApproved={handleRequestApproved}
                      teamId={selectedTeam.id}
                    />
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
