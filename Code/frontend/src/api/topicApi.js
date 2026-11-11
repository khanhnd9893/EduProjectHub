import apiClient from './client.js'
import { unwrap } from './response.js'

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
    const registrations = await unwrap(
      apiClient.get('/topics.php', {
        params: { action: 'registrations', ...filters },
      }),
    )
    return registrations.map(mapRegistration)
  },

  async createTopic(values) {
    const result = await unwrap(apiClient.post('/topics.php?action=create', values))
    return { id: Number(result.id) }
  },

  async updateTopic(id, values) {
    await unwrap(apiClient.patch('/topics.php?action=update', { id, ...values }))
  },

  async register(groupId, topicId, note = '') {
    return unwrap(
      apiClient.post('/topics.php?action=register', {
        group_id: groupId,
        topic_id: topicId,
        note,
      }),
    )
  },

  async review(registrationId, status, note = '') {
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
