import apiClient from './client.js'
import { unwrap } from './response.js'
import {
  findOrThrow,
  getMockUser,
  mockResolve,
  nextId,
  nowIso,
} from './mock/helpers.js'
import {
  mockInvitations,
  mockMembers,
  mockRequests,
  mockTeams,
} from './mock/teamMock.js'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

function mapTeam(team) {
  return {
    id: Number(team.id),
    groupCode: team.group_code,
    groupName: team.group_name,
    description: team.description,
    projectRoundId: Number(team.project_round_id),
    roundName: team.round_name,
    leaderUserId: Number(team.leader_user_id),
    leaderName: team.leader_name,
    createdBy: team.created_by == null ? null : Number(team.created_by),
    status: team.status,
    activeMemberCount: Number(
      team.active_member_count ?? team.members?.length ?? 0,
    ),
    createdAt: team.created_at,
    updatedAt: team.updated_at,
    dissolvedAt: team.dissolved_at ?? null,
    members: team.members?.map((member) => ({
      id: Number(member.group_member_id),
      userId: Number(member.user_id),
      fullName: member.full_name,
      memberRole: member.member_role,
      status: member.status,
      joinedAt: member.joined_at,
      leftAt: member.left_at,
    })),
  }
}

function mapRequest(request) {
  return {
    id: Number(request.id),
    groupId: Number(request.group_id),
    userId: Number(request.user_id),
    fullName: request.full_name,
    message: request.message,
    status: request.status,
    requestedAt: request.requested_at,
    reviewedBy:
      request.reviewed_by == null ? null : Number(request.reviewed_by),
    reviewedAt: request.reviewed_at,
    reviewNote: request.review_note,
  }
}

function mapInvitation(invitation) {
  return {
    id: Number(invitation.id),
    groupId: Number(invitation.group_id),
    groupName: invitation.group_name,
    invitedUserId: Number(invitation.invited_user_id),
    invitedName: invitation.invited_name ?? null,
    invitedStudentCode: invitation.invited_student_code ?? null,
    invitedBy: Number(invitation.invited_by),
    inviteCode: invitation.invite_code,
    message: invitation.message,
    status: invitation.status,
    sentAt: invitation.sent_at,
    respondedAt: invitation.responded_at,
    expiresAt: invitation.expires_at,
  }
}

function findMockTeam(teamId) {
  return findOrThrow(mockTeams, teamId, 'Không tìm thấy nhóm')
}

function assertCanAddMockMember(groupId, userId) {
  const team = findMockTeam(groupId)
  if (!['forming', 'active'].includes(team.status)) {
    throw new Error('Nhóm không còn nhận thành viên.')
  }

  const membership = mockMembers.find(
    (member) =>
      member.groupId === team.id &&
      member.userId === Number(userId) &&
      member.status === 'active',
  )
  if (membership) {
    throw new Error('Sinh viên này đã là thành viên của nhóm.')
  }

  const otherMembership = mockMembers.find((member) => {
    const memberTeam = mockTeams.find((entry) => entry.id === member.groupId)
    return (
      member.userId === Number(userId) &&
      member.status === 'active' &&
      memberTeam?.projectRoundId === team.projectRoundId &&
      ['forming', 'active'].includes(memberTeam.status)
    )
  })
  if (otherMembership) {
    throw new Error('Sinh viên đã thuộc một nhóm khác trong đợt đồ án này.')
  }

  const memberCount = mockMembers.filter(
    (member) => member.groupId === team.id && member.status === 'active',
  ).length
  if (memberCount >= 5) {
    throw new Error('Nhóm đã đạt số lượng thành viên tối đa.')
  }
}

function addMockMember(groupId, userId, fullName) {
  const existing = mockMembers.find(
    (member) => member.groupId === groupId && member.userId === userId,
  )

  if (existing) {
    existing.status = 'active'
    existing.leftAt = null
    return
  }

  mockMembers.push({
    id: nextId(mockMembers),
    groupId,
    userId,
    fullName,
    studentCode: null,
    memberRole: 'member',
    status: 'active',
    joinedAt: nowIso(),
    leftAt: null,
    note: null,
  })
}

const mockStudents = [
  { id: 1, studentCode: 'SV001', fullName: 'Nguyễn Văn A' },
  { id: 4, studentCode: 'SV002', fullName: 'Lê Thị Cúc' },
  { id: 5, studentCode: 'SV003', fullName: 'Phạm Minh Đức' },
  { id: 6, studentCode: 'SV004', fullName: 'Võ Thanh Hà' },
  { id: 7, studentCode: 'SV005', fullName: 'Trần Minh Phúc' },
  { id: 8, studentCode: 'SV006', fullName: 'Hoàng Gia Bảo' },
]

const teamApi = {
  async listTeams({ roundId, status } = {}) {
    if (useMock) {
      return mockResolve(
        mockTeams.filter(
          (team) =>
            (roundId === undefined ||
              team.projectRoundId === Number(roundId)) &&
            (status === undefined || team.status === status),
        ),
      )
    }

    const teams = await unwrap(
      apiClient.get('/groups.php', {
        params: { action: 'groups', round_id: roundId, status },
      }),
    )
    return teams.map(mapTeam)
  },

  async getTeam(teamId) {
    if (useMock) {
      const team = findOrThrow(mockTeams, teamId, 'Không tìm thấy nhóm')
      const members = mockMembers.filter(
        (member) => member.groupId === team.id && member.status === 'active',
      )
      return mockResolve({ ...team, members })
    }

    return mapTeam(
      await unwrap(
        apiClient.get('/groups.php', {
          params: { action: 'group', id: teamId },
        }),
      ),
    )
  },

  async createTeam({ groupCode, groupName, description, projectRoundId }) {
    if (useMock) {
      const user = getMockUser()
      if (user.role !== 'STUDENT') {
        throw new Error('Chỉ sinh viên mới được tạo nhóm.')
      }
      if (
        mockMembers.some((member) => {
          const team = mockTeams.find((entry) => entry.id === member.groupId)
          return (
            member.userId === user.id &&
            member.status === 'active' &&
            team?.projectRoundId === Number(projectRoundId ?? 1) &&
            ['forming', 'active'].includes(team.status)
          )
        })
      ) {
        throw new Error('Bạn đã thuộc một nhóm khác trong đợt đồ án này.')
      }
      const team = {
        id: nextId(mockTeams),
        groupCode,
        groupName,
        description,
        projectRoundId: projectRoundId ?? 1,
        leaderUserId: user.id,
        createdBy: user.id,
        status: 'forming',
        createdAt: nowIso(),
        updatedAt: nowIso(),
        dissolvedAt: null,
      }
      mockTeams.push(team)
      addMockMember(team.id, user.id, user.fullName)
      mockMembers.at(-1).memberRole = 'leader'
      return mockResolve(team)
    }

    if (projectRoundId === undefined) {
      throw new Error('projectRoundId là bắt buộc khi tạo nhóm bằng backend PHP.')
    }

    const result = await unwrap(
      apiClient.post('/groups.php?action=create', {
        group_code: groupCode,
        group_name: groupName,
        description,
        project_round_id: projectRoundId,
      }),
    )
    return teamApi.getTeam(result.id)
  },

  async listAvailableStudents(teamId) {
    if (useMock) {
      const team = findMockTeam(teamId)
      const currentUser = getMockUser()
      if (currentUser.role !== 'ADMIN' && currentUser.id !== team.leaderUserId) {
        throw new Error('Chỉ trưởng nhóm hoặc quản trị viên mới được thêm thành viên.')
      }

      const activeMembers = mockMembers.filter(
        (member) => member.groupId === team.id && member.status === 'active',
      ).length
      if (activeMembers >= 5 || !['forming', 'active'].includes(team.status)) {
        return []
      }

      return mockResolve(
        mockStudents.filter((student) => {
          const activeMembership = mockMembers.find((member) => {
            const memberTeam = mockTeams.find(
              (entry) => entry.id === member.groupId,
            )
            return (
              member.userId === student.id &&
              member.status === 'active' &&
              ['forming', 'active'].includes(memberTeam?.status) &&
              memberTeam?.projectRoundId === team.projectRoundId
            )
          })
          return !activeMembership
        }),
      )
    }

    const students = await unwrap(
      apiClient.get('/groups.php', {
        params: { action: 'available_students', group_id: teamId },
      }),
    )
    return students.map((student) => ({
      id: Number(student.id),
      studentCode: student.student_code,
      fullName: student.full_name,
    }))
  },

  async addMember(teamId, userId) {
    if (useMock) {
      const team = findMockTeam(teamId)
      const currentUser = getMockUser()
      if (currentUser.role !== 'ADMIN' && currentUser.id !== team.leaderUserId) {
        throw new Error('Chỉ trưởng nhóm hoặc quản trị viên mới được thêm thành viên.')
      }
      const student = mockStudents.find((entry) => entry.id === Number(userId))
      if (!student) {
        throw new Error('Không tìm thấy sinh viên.')
      }
      assertCanAddMockMember(teamId, student.id)
      addMockMember(Number(teamId), student.id, student.fullName)
      return mockResolve(student)
    }

    return unwrap(
      apiClient.post('/groups.php?action=add_member', {
        group_id: teamId,
        user_id: userId,
      }),
    )
  },

  async removeMember(teamId, userId) {
    if (useMock) {
      const member = mockMembers.find(
        (entry) =>
          entry.groupId === Number(teamId) && entry.userId === Number(userId),
      )

      const team = findMockTeam(teamId)
      const currentUser = getMockUser()
      if (
        currentUser.role !== 'ADMIN' &&
        currentUser.id !== team.leaderUserId
      ) {
        throw new Error('Chỉ trưởng nhóm hoặc quản trị viên mới được xóa thành viên.')
      }
      if (!member) {
        throw new Error('Không tìm thấy thành viên')
      }
      if (Number(userId) === team.leaderUserId) {
        throw new Error('Hãy chuyển trưởng nhóm trước khi xóa thành viên này.')
      }

      member.status = 'removed'
      member.leftAt = nowIso()
      return mockResolve(member)
    }

    return unwrap(
      apiClient.delete('/groups.php?action=remove_member', {
        data: { group_id: teamId, user_id: userId },
      }),
    )
  },

  async listRequests(teamId) {
    if (useMock) {
      return mockResolve(
        mockRequests.filter((request) => request.groupId === Number(teamId)),
      )
    }

    return (
      await unwrap(
        apiClient.get('/groups.php', {
          params: { action: 'requests', group_id: teamId },
        }),
      )
    ).map(mapRequest)
  },

  async sendJoinRequest(teamId, { message }) {
    if (useMock) {
      const user = getMockUser()
      const team = findMockTeam(teamId)
      if (user.role !== 'STUDENT') {
        throw new Error('Chỉ sinh viên mới được gửi yêu cầu tham gia nhóm.')
      }
      if (!['forming', 'active'].includes(team.status)) {
        throw new Error('Nhóm không còn nhận thành viên.')
      }
      assertCanAddMockMember(teamId, user.id)
      if (
        mockRequests.some(
          (entry) =>
            entry.groupId === Number(teamId) &&
            entry.userId === user.id &&
            entry.status === 'pending',
        )
      ) {
        throw new Error('Bạn đã có yêu cầu đang chờ duyệt.')
      }
      const request = {
        id: nextId(mockRequests),
        groupId: Number(teamId),
        userId: user.id,
        fullName: user.fullName,
        message,
        status: 'pending',
        requestedAt: nowIso(),
        reviewedBy: null,
        reviewedAt: null,
        reviewNote: null,
      }
      mockRequests.push(request)
      return mockResolve(request)
    }

    const request = await unwrap(
      apiClient.post('/groups.php?action=request', {
        group_id: teamId,
        message,
      }),
    )
    return { id: Number(request.id), groupId: Number(teamId) }
  },

  async reviewRequest(requestId, { status, reviewNote }) {
    if (useMock) {
      const request = findOrThrow(
        mockRequests,
        requestId,
        'Không tìm thấy yêu cầu',
      )
      const team = findMockTeam(request.groupId)
      const user = getMockUser()
      if (user.role !== 'ADMIN' && user.id !== team.leaderUserId) {
        throw new Error('Chỉ trưởng nhóm hoặc quản trị viên mới được duyệt yêu cầu.')
      }
      if (request.status !== 'pending') {
        throw new Error('Yêu cầu này đã được xử lý.')
      }
      if (!['approved', 'rejected'].includes(status)) {
        throw new Error('Trạng thái duyệt yêu cầu không hợp lệ.')
      }
      if (status === 'approved') {
        assertCanAddMockMember(request.groupId, request.userId)
        addMockMember(request.groupId, request.userId, request.fullName)
      }
      request.status = status
      request.reviewNote = reviewNote
      request.reviewedBy = user.id
      request.reviewedAt = nowIso()

      return mockResolve(request)
    }

    await unwrap(
      apiClient.patch('/groups.php?action=review_request', {
        request_id: requestId,
        status,
        review_note: reviewNote,
      }),
    )
    return { id: Number(requestId), status, reviewNote }
  },

  async listInvitations() {
    if (useMock) {
      const { id } = getMockUser()
      return mockResolve(
        mockInvitations.filter((invitation) => invitation.invitedUserId === id),
      )
    }

    return (
      await unwrap(
        apiClient.get('/groups.php', {
          params: { action: 'invitations' },
        }),
      )
    ).map(mapInvitation)
  },

  async listSentInvitations() {
    if (useMock) {
      const { id, role } = getMockUser()
      return mockResolve(
        mockInvitations
          .filter((invitation) => {
            const team = mockTeams.find((entry) => entry.id === invitation.groupId)
            return role === 'ADMIN' || team?.leaderUserId === id
          })
          .map((invitation) => ({ ...invitation })),
      )
    }

    return (
      await unwrap(
        apiClient.get('/groups.php', {
          params: { action: 'sent_invitations' },
        }),
      )
    ).map(mapInvitation)
  },

  async sendInvitation(teamId, { invitedUserId, message }) {
    if (useMock) {
      const team = findOrThrow(mockTeams, teamId, 'Không tìm thấy nhóm')
      const user = getMockUser()
      if (user.role !== 'ADMIN' && user.id !== team.leaderUserId) {
        throw new Error('Chỉ trưởng nhóm hoặc quản trị viên mới được mời thành viên.')
      }
      assertCanAddMockMember(teamId, invitedUserId)
      const invitation = {
        id: nextId(mockInvitations),
        groupId: team.id,
        groupName: team.groupName,
        invitedUserId,
        inviteCode: Array.from(
          { length: 8 },
          () => Math.floor(Math.random() * 16).toString(16),
        ).join('').toUpperCase(),
        invitedBy: getMockUser().id,
        message,
        status: 'pending',
        sentAt: nowIso(),
        respondedAt: null,
        expiresAt: null,
      }
      mockInvitations.push(invitation)
      return mockResolve(invitation)
    }

    const invitation = await unwrap(
      apiClient.post('/groups.php?action=invite', {
        group_id: teamId,
        invited_user_id: invitedUserId,
        message,
      }),
    )
    return {
      id: Number(invitation.id),
      groupId: Number(teamId),
      inviteCode: invitation.invite_code,
    }
  },

  async respondInvitation(invitationId, { status }) {
    if (useMock) {
      const invitation = findOrThrow(
        mockInvitations,
        invitationId,
        'Không tìm thấy lời mời',
      )
      const user = getMockUser()
      if (user.id !== invitation.invitedUserId) {
        throw new Error('Bạn không có quyền phản hồi lời mời này.')
      }
      if (invitation.status !== 'pending') {
        throw new Error('Lời mời này đã được phản hồi.')
      }
      if (!['accepted', 'rejected'].includes(status)) {
        throw new Error('Trạng thái phản hồi lời mời không hợp lệ.')
      }
      if (status === 'accepted') {
        assertCanAddMockMember(invitation.groupId, user.id)
        addMockMember(invitation.groupId, user.id, user.fullName)
      }
      invitation.status = status
      invitation.respondedAt = nowIso()

      return mockResolve(invitation)
    }

    await unwrap(
      apiClient.patch('/groups.php?action=respond_invitation', {
        invitation_id: invitationId,
        status,
      }),
    )
    return { id: Number(invitationId), status }
  },
}

export default teamApi
