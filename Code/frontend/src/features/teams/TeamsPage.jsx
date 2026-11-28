import { useEffect, useMemo, useState } from 'react'
import PageHeading from '../../components/PageHeading.jsx'
import teamApi from '../../api/teamApi.js'
import { useAuth } from '../../contexts/useAuth.js'
import { canViewAllGroups, isStudentRole } from '../../utils/roles.js'
import AddMemberForm from './AddMemberForm.jsx'
import InviteMemberForm from './InviteMemberForm.jsx'
import JoinRequestsPanel from './JoinRequestsPanel.jsx'
import MyInvitationsPanel from './MyInvitationsPanel.jsx'

const groupStatuses = {
  forming: 'Mới tạo (Đang thành lập)',
  active: 'Đang hoạt động',
  completed: 'Đã hoàn thành',
  dissolved: 'Đã xóa (Đã giải tán)',
}

const statusFilters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'forming', label: 'Nhóm mới tạo' },
  { key: 'active', label: 'Đang hoạt động' },
  { key: 'dissolved', label: 'Nhóm đã xóa' },
  { key: 'completed', label: 'Đã hoàn thành' },
]

function formatDateTime(value) {
  if (!value) {
    return 'Chưa có thông tin'
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Chưa có thông tin'
    : date.toLocaleString('vi-VN')
}

function formatPerson(name, studentCode) {
  if (!name) {
    return 'Chưa có thông tin'
  }
  return studentCode ? `${name} (${studentCode})` : name
}

function TeamsPage() {
  const { user, role, refreshCurrentUser } = useAuth()
  const [teams, setTeams] = useState([])
  const [selectedTeamId, setSelectedTeamId] = useState(null)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoadingTeams, setIsLoadingTeams] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showAddMemberForm, setShowAddMemberForm] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [groupCode, setGroupCode] = useState('')
  const [groupName, setGroupName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const canMonitorGroups = canViewAllGroups(role)

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

  const statusCounts = useMemo(() => {
    const counts = {
      all: teams.length,
      forming: 0,
      active: 0,
      dissolved: 0,
      completed: 0,
    }
    teams.forEach((team) => {
      if (Object.hasOwn(counts, team.status)) {
        counts[team.status] += 1
      }
    })
    return counts
  }, [teams])

  const filteredTeams = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()
    return teams.filter((team) => {
      if (statusFilter !== 'all' && team.status !== statusFilter) {
        return false
      }
      if (!keyword) {
        return true
      }
      const haystack = [
        team.groupName,
        team.groupCode,
        team.leaderName,
        team.leaderStudentCode,
        team.creatorName,
        team.creatorStudentCode,
        team.roundName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(keyword)
    })
  }, [searchQuery, statusFilter, teams])

  const activeTeamId = filteredTeams.some((team) => team.id === selectedTeamId)
    ? selectedTeamId
    : (filteredTeams[0]?.id ?? null)

  useEffect(() => {
    if (activeTeamId === null) {
      return undefined
    }

    let isCurrent = true
    teamApi
      .getTeam(activeTeamId)
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
  }, [activeTeamId])

  const selectedLeader =
    selectedTeam?.members?.find((member) => member.memberRole === 'leader')
      ?.fullName || selectedTeam?.leaderName
  const canManageSelectedTeam =
    isStudentRole(role) && selectedTeam?.leaderUserId === user?.id
  const isSelectedTeamLoading =
    activeTeamId !== null && selectedTeam?.id !== activeTeamId && !error
  const showFilterToolbar =
    canMonitorGroups || teams.some((team) => team.status === 'dissolved')

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
      setStatusFilter('all')
      setSelectedTeamId(team.id)
      setIsCreating(false)
      setGroupCode('')
      setGroupName('')
      setDescription('')
      try {
        await refreshCurrentUser()
      } catch (refreshError) {
        setError(
          `Nhóm đã được tạo nhưng không thể cập nhật vai trò hiển thị. Vui lòng tải lại trang. ${refreshError.message || ''}`,
        )
      }
    } catch (saveError) {
      setError(saveError.message || 'Không thể tạo nhóm.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRemoveMember(userId) {
    setError('')
    try {
      await teamApi.removeMember(activeTeamId, userId)
      const updatedTeam = await teamApi.getTeam(activeTeamId)
      setSelectedTeam(updatedTeam)
      await refreshTeams()
    } catch (removeError) {
      setError(removeError.message || 'Không thể xóa thành viên.')
    }
  }

  async function handleLeaveGroup() {
    if (!window.confirm('Bạn có chắc chắn muốn rời khỏi nhóm này?')) {
      return
    }
    setError('')
    try {
      await teamApi.leaveGroup(activeTeamId)
      const remainingTeams = await refreshTeams()
      setSelectedTeamId(remainingTeams[0]?.id ?? null)
      setSelectedTeam(null)
      await refreshCurrentUser()
    } catch (leaveError) {
      setError(leaveError.message || 'Không thể rời khỏi nhóm.')
    }
  }

  async function handleDissolveTeam() {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhóm này? Thao tác này không thể hoàn tác.')) {
      return
    }
    setError('')
    try {
      await teamApi.dissolveTeam(activeTeamId)
      const remainingTeams = await refreshTeams()
      setSelectedTeamId(remainingTeams[0]?.id ?? null)
      setSelectedTeam(null)
      await refreshCurrentUser()
    } catch (dissolveError) {
      setError(dissolveError.message || 'Không thể xóa nhóm.')
    }
  }

  async function handleMemberAdded() {
    setSelectedTeam(await teamApi.getTeam(activeTeamId))
    await refreshTeams()
  }

  async function handleRequestApproved() {
    setSelectedTeam(await teamApi.getTeam(activeTeamId))
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
        description={
          canMonitorGroups
            ? 'Theo dõi các nhóm mới tạo, nhóm đang hoạt động và nhóm đã xóa của sinh viên, trưởng nhóm.'
            : 'Danh sách nhóm và thông tin thành viên được tải từ API nhóm.'
        }
        status={isLoadingTeams ? 'Đang tải' : `${filteredTeams.length} nhóm`}
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
      {!isLoadingTeams && showFilterToolbar && (
        <div className="teams-toolbar">
          <div className="teams-filters" role="group" aria-label="Lọc nhóm theo trạng thái">
            {statusFilters
              .filter(
                (item) =>
                  item.key === 'all' ||
                  canMonitorGroups ||
                  statusCounts[item.key] > 0,
              )
              .map((item) => (
                <button
                  className={`teams-filter-button${statusFilter === item.key ? ' is-active' : ''}`}
                  key={item.key}
                  onClick={() => {
                    setError('')
                    setShowAddMemberForm(false)
                    setShowInviteForm(false)
                    setStatusFilter(item.key)
                  }}
                  type="button"
                >
                  {item.label} ({statusCounts[item.key]})
                </button>
              ))}
          </div>
          {canMonitorGroups && (
            <label className="field-control teams-search">
              <span className="sr-only">Tìm nhóm theo tên, mã hoặc trưởng nhóm</span>
              <input
                aria-label="Tìm nhóm theo tên, mã hoặc trưởng nhóm"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm mã nhóm, tên nhóm, sinh viên..."
                type="search"
                value={searchQuery}
              />
            </label>
          )}
        </div>
      )}
      {isLoadingTeams ? (
        <p className="teams-message" role="status">
          Đang tải danh sách nhóm...
        </p>
      ) : teams.length === 0 ? (
        <section className="workspace-panel teams-message">
          Chưa có nhóm nào để hiển thị.
        </section>
      ) : filteredTeams.length === 0 ? (
        <section className="workspace-panel teams-message">
          Không có nhóm nào phù hợp với bộ lọc hiện tại.
        </section>
      ) : (
        <div className="teams-layout">
          <section className="teams-list" aria-label="Danh sách nhóm">
            {filteredTeams.map((team) => (
              <button
                className={`team-option${team.id === activeTeamId ? ' is-selected' : ''}${team.status === 'dissolved' ? ' is-dissolved' : ''}`}
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
                  <span
                    className={`status-chip status-chip--${team.status}`}
                  >
                    {groupStatuses[team.status] || team.status}
                  </span>
                </span>
                <span className="muted">
                  Mã nhóm: {team.groupCode || 'Chưa có'}
                </span>
                <span className="muted">
                  Trưởng nhóm: {formatPerson(team.leaderName, team.leaderStudentCode)}
                </span>
                <span className="muted">
                  {team.roundName || `Đợt đồ án ${team.projectRoundId}`}
                </span>
                <span className="muted team-option-meta">
                  {team.status === 'dissolved'
                    ? `Đã xóa: ${formatDateTime(team.dissolvedAt || team.updatedAt)}`
                    : `Ngày tạo: ${formatDateTime(team.createdAt)}`}
                </span>
              </button>
            ))}
          </section>

          <section className="workspace-panel team-details" aria-live="polite">
            {isSelectedTeamLoading ? (
              <p className="teams-message" role="status">
                Đang tải thông tin nhóm...
              </p>
            ) : selectedTeam?.id !== activeTeamId ? (
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
                    <dt>Đợt đồ án</dt>
                    <dd>
                      {selectedTeam.roundName ||
                        `Đợt đồ án ${selectedTeam.projectRoundId}`}
                    </dd>
                  </div>
                  <div>
                    <dt>Trưởng nhóm</dt>
                    <dd>
                      {formatPerson(
                        selectedLeader,
                        selectedTeam.leaderStudentCode,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Người tạo nhóm</dt>
                    <dd>
                      {formatPerson(
                        selectedTeam.creatorName || selectedLeader,
                        selectedTeam.creatorStudentCode,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Ngày tạo</dt>
                    <dd>{formatDateTime(selectedTeam.createdAt)}</dd>
                  </div>
                  {(selectedTeam.status === 'dissolved' ||
                    selectedTeam.dissolvedAt) && (
                    <div>
                      <dt>Ngày xóa</dt>
                      <dd>
                        {formatDateTime(
                          selectedTeam.dissolvedAt || selectedTeam.updatedAt,
                        )}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt>Số thành viên</dt>
                    <dd>
                      {selectedTeam.status === 'dissolved'
                        ? `${selectedTeam.members?.length ?? selectedTeam.totalMemberCount ?? 0} (trước khi xóa)`
                        : (selectedTeam.members?.length ?? 0)}
                    </dd>
                  </div>
                </dl>
                {canManageSelectedTeam &&
                  ['forming', 'active'].includes(selectedTeam.status) && (
                    <button
                      className="button-secondary"
                      onClick={handleDissolveTeam}
                      type="button"
                    >
                      Xóa nhóm
                    </button>
                  )}
                <h3>
                  {selectedTeam.status === 'dissolved'
                    ? 'Thành viên trước khi xóa'
                    : 'Thành viên'}
                </h3>
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
                        <span>
                          {formatPerson(member.fullName, member.studentCode)}
                        </span>
                        <span className="muted">
                          {member.memberRole === 'leader'
                            ? 'Trưởng nhóm'
                            : 'Thành viên'}
                          {selectedTeam.status === 'dissolved' &&
                            ` · Đã giải tán${member.leftAt ? ` (${formatDateTime(member.leftAt)})` : ''}`}
                        </span>
                        {canManageSelectedTeam &&
                          ['forming', 'active'].includes(selectedTeam.status) &&
                          member.userId !== selectedTeam.leaderUserId && (
                            <button
                              className="button-secondary"
                              onClick={() => handleRemoveMember(member.userId)}
                              type="button"
                            >
                              Xóa
                            </button>
                          )}
                        {!canManageSelectedTeam &&
                          member.userId === user?.id &&
                          member.memberRole !== 'leader' &&
                          ['forming', 'active'].includes(selectedTeam.status) && (
                            <button
                              className="button-secondary"
                              onClick={handleLeaveGroup}
                              type="button"
                            >
                              Rời nhóm
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
