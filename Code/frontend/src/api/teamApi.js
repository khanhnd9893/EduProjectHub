import apiClient from './client.js'
import { backendNotImplemented, unwrap } from './response.js'
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
    activeMemberCount: Number(team.active_member_count),
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

    return unwrap(
      apiClient.post('/groups.php?action=create', {
        group_code: groupCode,
        group_name: groupName,
        description,
        project_round_id: projectRoundId,
      }),
    )
  },

  async removeMember(teamId, userId) {
    if (useMock) {
      const member = mockMembers.find(
        (entry) =>
          entry.groupId === Number(teamId) && entry.userId === Number(userId),
      )

      if (!member) {
        throw new Error('Không tìm thấy thành viên')
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

    return backendNotImplemented('yêu cầu tham gia nhóm')
  },

  async sendJoinRequest(teamId, { message }) {
    if (useMock) {
      const user = getMockUser()
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

    return backendNotImplemented('gửi yêu cầu tham gia nhóm')
  },

  async reviewRequest(requestId, { status, reviewNote }) {
    if (useMock) {
      const request = findOrThrow(
        mockRequests,
        requestId,
        'Không tìm thấy yêu cầu',
      )
      request.status = status
      request.reviewNote = reviewNote
      request.reviewedBy = getMockUser().id
      request.reviewedAt = nowIso()

      if (status === 'approved') {
        addMockMember(request.groupId, request.userId, request.fullName)
      }

      return mockResolve(request)
    }

    return backendNotImplemented('duyệt yêu cầu tham gia nhóm')
  },

  async listInvitations() {
    if (useMock) {
      const { id } = getMockUser()
      return mockResolve(
        mockInvitations.filter((invitation) => invitation.invitedUserId === id),
      )
    }

    return backendNotImplemented('lời mời nhóm')
  },

  async sendInvitation(teamId, { invitedUserId, message }) {
    if (useMock) {
      const team = findOrThrow(mockTeams, teamId, 'Không tìm thấy nhóm')
      const invitation = {
        id: nextId(mockInvitations),
        groupId: team.id,
        groupName: team.groupName,
        invitedUserId,
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

    return backendNotImplemented('gửi lời mời nhóm')
  },

  async respondInvitation(invitationId, { status }) {
    if (useMock) {
      const invitation = findOrThrow(
        mockInvitations,
        invitationId,
        'Không tìm thấy lời mời',
      )
      invitation.status = status
      invitation.respondedAt = nowIso()

      if (status === 'accepted') {
        const user = getMockUser()
        addMockMember(invitation.groupId, user.id, user.fullName)
      }

      return mockResolve(invitation)
    }

    return backendNotImplemented('phản hồi lời mời nhóm')
  },
}

export default teamApi
