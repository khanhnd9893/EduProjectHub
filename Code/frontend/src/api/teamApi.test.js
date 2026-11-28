import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
})
after(() => vite.close())

const { default: teamApi } = await vite.ssrLoadModule('/src/api/teamApi.js')
const { default: apiClient } = await vite.ssrLoadModule('/src/api/client.js')
const { canViewAllGroups } = await vite.ssrLoadModule('/src/utils/roles.js')

test('canViewAllGroups allows lecturer, admin, and training manager only', () => {
  assert.equal(canViewAllGroups('LECTURER'), true)
  assert.equal(canViewAllGroups('ADMIN'), true)
  assert.equal(canViewAllGroups('TRAINING_MANAGER'), true)
  assert.equal(canViewAllGroups('STUDENT'), false)
  assert.equal(canViewAllGroups('TEAM_LEADER'), false)
})

test('listTeams forwards scope and maps creator, leader, and dissolved fields', async () => {
  const originalGet = apiClient.get
  apiClient.get = async (path, options) => {
    assert.equal(path, '/groups.php')
    assert.deepEqual(options.params, {
      action: 'groups',
      round_id: undefined,
      status: 'dissolved',
      scope: 'assigned',
    })
    return {
      data: {
        data: [
          {
            id: '12',
            group_code: 'N12',
            group_name: 'Nhóm đã xóa demo',
            description: null,
            project_round_id: '1',
            round_name: 'HK1',
            leader_user_id: '9',
            leader_name: 'Trưởng nhóm demo',
            leader_student_code: 'SV007',
            created_by: '9',
            creator_name: 'Trưởng nhóm demo',
            creator_student_code: 'SV007',
            creator_role: 'team_leader',
            status: 'dissolved',
            active_member_count: '0',
            total_member_count: '2',
            created_at: '2026-11-20 08:00:00',
            updated_at: '2026-11-21 09:00:00',
            dissolved_at: '2026-11-21 09:00:00',
          },
        ],
      },
    }
  }
  try {
    const teams = await teamApi.listTeams({
      status: 'dissolved',
      scope: 'assigned',
    })
    assert.equal(teams.length, 1)
    assert.deepEqual(teams[0], {
      id: 12,
      groupCode: 'N12',
      groupName: 'Nhóm đã xóa demo',
      description: null,
      projectRoundId: 1,
      roundName: 'HK1',
      leaderUserId: 9,
      leaderName: 'Trưởng nhóm demo',
      leaderStudentCode: 'SV007',
      createdBy: 9,
      creatorName: 'Trưởng nhóm demo',
      creatorStudentCode: 'SV007',
      creatorRole: 'team_leader',
      status: 'dissolved',
      activeMemberCount: 0,
      totalMemberCount: 2,
      createdAt: '2026-11-20 08:00:00',
      updatedAt: '2026-11-21 09:00:00',
      dissolvedAt: '2026-11-21 09:00:00',
      members: undefined,
    })
  } finally {
    apiClient.get = originalGet
  }
})

test('getTeam maps member studentCode and dissolved membership metadata', async () => {
  const originalGet = apiClient.get
  apiClient.get = async (path, options) => {
    assert.equal(path, '/groups.php')
    assert.deepEqual(options.params, { action: 'group', id: 12 })
    return {
      data: {
        data: {
          id: 12,
          group_code: 'N12',
          group_name: 'Nhóm đã xóa demo',
          description: 'Mô tả',
          project_round_id: 1,
          round_name: 'HK1',
          leader_user_id: 9,
          leader_name: 'Trưởng nhóm demo',
          leader_student_code: 'SV007',
          created_by: 9,
          creator_name: 'Trưởng nhóm demo',
          creator_student_code: 'SV007',
          creator_role: 'team_leader',
          status: 'dissolved',
          created_at: '2026-11-20 08:00:00',
          updated_at: '2026-11-21 09:00:00',
          dissolved_at: '2026-11-21 09:00:00',
          members: [
            {
              group_member_id: 30,
              user_id: 9,
              student_code: 'SV007',
              full_name: 'Trưởng nhóm demo',
              member_role: 'leader',
              status: 'removed',
              joined_at: '2026-11-20 08:00:00',
              left_at: '2026-11-21 09:00:00',
            },
          ],
        },
      },
    }
  }
  try {
    const team = await teamApi.getTeam(12)
    assert.equal(team.members.length, 1)
    assert.equal(team.members[0].studentCode, 'SV007')
    assert.equal(team.members[0].status, 'removed')
    assert.equal(team.members[0].leftAt, '2026-11-21 09:00:00')
  } finally {
    apiClient.get = originalGet
  }
})
