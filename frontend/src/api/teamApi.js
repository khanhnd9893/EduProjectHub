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

// Endpoint thật: đề xuất, chờ M5 xác nhận.

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

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
  async listTeams() {
    if (useMock) {
      return mockResolve(mockTeams)
    }

    return unwrap(apiClient.get('/teams'))
  },

  async getTeam(teamId) {
    if (useMock) {
      const team = findOrThrow(mockTeams, teamId, 'Không tìm thấy nhóm')
      const members = mockMembers.filter(
        (member) => member.groupId === team.id && member.status === 'active',
      )
      return mockResolve({ ...team, members })
    }

    return unwrap(apiClient.get(`/teams/${teamId}`))
  },

  async createTeam({ groupCode, groupName, description }) {
    if (useMock) {
      const user = getMockUser()
      const team = {
        id: nextId(mockTeams),
        groupCode,
        groupName,
        description,
        projectRoundId: 1,
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

    return unwrap(
      apiClient.post('/teams', { groupCode, groupName, description }),
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

    return unwrap(apiClient.delete(`/teams/${teamId}/members/${userId}`))
  },

  async listRequests(teamId) {
    if (useMock) {
      return mockResolve(
        mockRequests.filter((request) => request.groupId === Number(teamId)),
      )
    }

    return unwrap(apiClient.get(`/teams/${teamId}/requests`))
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

    return unwrap(apiClient.post(`/teams/${teamId}/requests`, { message }))
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

    return unwrap(
      apiClient.patch(`/team-requests/${requestId}`, { status, reviewNote }),
    )
  },

  async listInvitations() {
    if (useMock) {
      const { id } = getMockUser()
      return mockResolve(
        mockInvitations.filter((invitation) => invitation.invitedUserId === id),
      )
    }

    return unwrap(apiClient.get('/team-invitations'))
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

    return unwrap(
      apiClient.post(`/teams/${teamId}/invitations`, {
        invitedUserId,
        message,
      }),
    )
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

    return unwrap(
      apiClient.patch(`/team-invitations/${invitationId}`, { status }),
    )
  },
}

export default teamApi
