import apiClient from './client.js'
import { unwrap } from './response.js'
import {
  findOrThrow,
  getMockUser,
  mockResolve,
  nextId,
  nowIso,
} from './mock/helpers.js'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

const mockTopics = [
  ['FR01-01', 'Xây dựng hệ thống đăng nhập', 'Nguyễn Minh Anh', 'open'],
  ['FR01-02', 'Xác thực và phân quyền người dùng', 'Trần Thị Bích', 'open'],
  ['FR02-01', 'Quản lý hồ sơ cá nhân', 'Lê Hoàng Nam', 'draft'],
  ['FR02-02', 'Thiết kế giao diện hồ sơ sinh viên', 'Phạm Thu Hà', 'closed'],
  ['FR03-01', 'Quản lý tài khoản quản trị', 'Nguyễn Minh Anh', 'open'],
  ['FR03-02', 'Theo dõi trạng thái tài khoản', 'Trần Thị Bích', 'draft'],
  ['FR04-01', 'Quản lý học kỳ đồ án', 'Lê Hoàng Nam', 'open'],
  ['FR04-02', 'Đăng ký đợt đồ án trực tuyến', 'Phạm Thu Hà', 'closed'],
  ['FR05-01', 'Cổng đăng ký đề tài', 'Nguyễn Minh Anh', 'open'],
  ['FR05-02', 'Tìm kiếm đề tài theo lĩnh vực', 'Trần Thị Bích', 'open'],
  ['FR05-03', 'Theo dõi số nhóm đăng ký', 'Lê Hoàng Nam', 'draft'],
  ['FR06-01', 'Phân công giảng viên hướng dẫn', 'Phạm Thu Hà', 'closed'],
  ['FR06-02', 'Quản lý thành viên đồ án', 'Nguyễn Minh Anh', 'open'],
  ['FR07-01', 'Dashboard tiến độ đồ án', 'Trần Thị Bích', 'open'],
  ['FR07-02', 'Báo cáo kết quả đồ án', 'Lê Hoàng Nam', 'draft'],
].map(([topicCode, title, supervisorName, status], index) => ({
  id: index + 1,
  project_round_id: 1,
  topic_code: topicCode,
  title,
  description: `Đề tài mẫu ${title.toLowerCase()} cho đợt đồ án hiện tại.`,
  supervisor_user_id: 10 + (index % 4),
  supervisor_name: supervisorName,
  max_groups: 2 + (index % 4),
  status,
  approved_groups: status === 'closed' ? 2 : index % 3,
  created_by: 3,
  created_at: nowIso(),
  updated_at: nowIso(),
}))

const mockRegistrations = [
  {
    id: 1,
    topic_id: 9,
    topic_code: 'FR05-01',
    topic_title: 'Cổng đăng ký đề tài',
    group_id: 1,
    group_name: 'Nhóm EduProjectHub',
    group_code: 'N01',
    leader_user_id: 1,
    registered_by: 1,
    registered_by_name: 'Nguyễn Văn A',
    status: 'pending',
    note: '',
    reviewer_name: null,
    reviewed_at: null,
    created_at: nowIso(),
  },
]

function mapTopic(topic) {
  return {
    id: Number(topic.id),
    projectRoundId: Number(topic.project_round_id),
    topicCode: topic.topic_code,
    title: topic.title,
    description: topic.description,
    supervisorUserId:
      topic.supervisor_user_id == null ? null : Number(topic.supervisor_user_id),
    supervisorName: topic.supervisor_name ?? null,
    maxGroups: Number(topic.max_groups),
    approvedGroups: Number(topic.approved_groups ?? 0),
    status: topic.status,
  }
}

function mapRegistration(registration) {
  return {
    id: Number(registration.id),
    topicId: Number(registration.topic_id),
    topicCode: registration.topic_code,
    topicTitle: registration.topic_title,
    groupId: Number(registration.group_id),
    groupName: registration.group_name,
    groupCode: registration.group_code,
    leaderUserId: Number(registration.leader_user_id),
    registeredBy: Number(registration.registered_by),
    registeredByName: registration.registered_by_name,
    status: registration.status,
    note: registration.note,
    reviewerName: registration.reviewer_name,
    reviewedAt: registration.reviewed_at,
    createdAt: registration.created_at,
  }
}

const topicApi = {
  async listTopics(roundId) {
    if (useMock) {
      const topics = roundId
        ? mockTopics.filter((topic) => topic.project_round_id === Number(roundId))
        : mockTopics
      return mockResolve(topics.map(mapTopic))
    }

    const topics = await unwrap(
      apiClient.get('/topics.php', {
        params: {
          action: 'topics',
          ...(roundId ? { round_id: roundId } : {}),
        },
      }),
    )
    return topics.map(mapTopic)
  },

  async listRegistrations(filters = {}) {
    if (useMock) {
      const registrations = mockRegistrations.filter((registration) =>
        Object.entries(filters).every(
          ([key, value]) => value == null || String(registration[key] ?? '') === String(value),
        ),
      )
      return mockResolve(registrations.map(mapRegistration))
    }

    const registrations = await unwrap(
      apiClient.get('/topics.php', {
        params: { action: 'registrations', ...filters },
      }),
    )
    return registrations.map(mapRegistration)
  },

  async createTopic(values) {
    if (useMock) {
      const topic = {
        id: nextId(mockTopics),
        project_round_id: Number(values.project_round_id),
        topic_code: values.topic_code,
        title: values.title,
        description: values.description ?? null,
        supervisor_user_id: values.supervisor_user_id
          ? Number(values.supervisor_user_id)
          : null,
        supervisor_name: values.supervisor_name ?? null,
        max_groups: Number(values.max_groups),
        status: values.status ?? 'draft',
        approved_groups: 0,
        created_by: Number(getMockUser().id),
        created_at: nowIso(),
        updated_at: nowIso(),
      }
      mockTopics.unshift(topic)
      return mockResolve({ id: topic.id })
    }

    const result = await unwrap(apiClient.post('/topics.php?action=create', values))
    return { id: Number(result.id) }
  },

  async updateTopic(id, values) {
    if (useMock) {
      const topic = findOrThrow(mockTopics, id, 'Không tìm thấy đề tài.')
      Object.assign(topic, {
        ...values,
        project_round_id: values.project_round_id
          ? Number(values.project_round_id)
          : topic.project_round_id,
        max_groups: values.max_groups
          ? Number(values.max_groups)
          : topic.max_groups,
        updated_at: nowIso(),
      })
      return mockResolve(undefined)
    }

    await unwrap(apiClient.patch('/topics.php?action=update', { id, ...values }))
  },

  async register(groupId, topicId, note = '') {
    if (useMock) {
      const topic = findOrThrow(mockTopics, topicId, 'Không tìm thấy đề tài.')
      if (topic.status !== 'open') {
        throw new Error('Đề tài không còn nhận đăng ký.')
      }

      const existing = mockRegistrations.find(
        (registration) =>
          registration.group_id === Number(groupId) &&
          ['pending', 'approved'].includes(registration.status),
      )
      if (existing) {
        throw new Error('Nhóm đã có đề tài đang đăng ký hoặc được duyệt.')
      }

      const user = getMockUser()
      const registration = {
        id: nextId(mockRegistrations),
        topic_id: topic.id,
        topic_code: topic.topic_code,
        topic_title: topic.title,
        group_id: Number(groupId),
        group_name: `Nhóm đồ án ${groupId}`,
        group_code: `N${String(groupId).padStart(2, '0')}`,
        leader_user_id: Number(user.id),
        registered_by: Number(user.id),
        registered_by_name: user.fullName || user.full_name || 'Sinh viên',
        status: 'pending',
        note,
        reviewer_name: null,
        reviewed_at: null,
        created_at: nowIso(),
      }
      mockRegistrations.push(registration)
      return mockResolve({ id: registration.id, status: registration.status })
    }

    return unwrap(
      apiClient.post('/topics.php?action=register', {
        group_id: groupId,
        topic_id: topicId,
        note,
      }),
    )
  },

  async review(registrationId, status, note = '') {
    if (useMock) {
      const registration = findOrThrow(
        mockRegistrations,
        registrationId,
        'Không tìm thấy đăng ký đề tài.',
      )
      if (!['approved', 'rejected'].includes(status)) {
        throw new Error('Trạng thái duyệt không hợp lệ.')
      }
      if (registration.status !== 'pending') {
        throw new Error('Đăng ký này đã được xử lý.')
      }

      registration.status = status
      registration.note = note || registration.note
      registration.reviewer_name = getMockUser().fullName || 'Người duyệt'
      registration.reviewed_at = nowIso()
      if (status === 'approved') {
        const topic = findOrThrow(mockTopics, registration.topic_id, 'Không tìm thấy đề tài.')
        topic.approved_groups += 1
      }
      return mockResolve(undefined)
    }

    await unwrap(
      apiClient.patch('/topics.php?action=review', {
        registration_id: registrationId,
        status,
        note,
      }),
    )
  },
}

export default topicApi
