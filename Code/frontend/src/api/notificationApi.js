import apiClient from './client.js'
import { unwrap } from './response.js'
import { daysFromNow, mockResolve } from './mock/helpers.js'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

const mockNotifications = [
  {
    id: 1,
    type: 'topic_registration',
    title: 'Có đăng ký đề tài mới',
    body: 'Nhóm EduProjectHub đã gửi đăng ký đề tài Cổng đăng ký đề tài.',
    entity_type: 'topic_registration',
    entity_id: 1,
    actor_user_id: 1,
    is_read: 0,
    created_at: daysFromNow(-1),
  },
  {
    id: 2,
    type: 'topic_approved',
    title: 'Đề tài đã được duyệt',
    body: 'Đề tài Xây dựng hệ thống đăng nhập của nhóm đã được duyệt.',
    entity_type: 'project_topic',
    entity_id: 1,
    actor_user_id: 3,
    is_read: 0,
    created_at: daysFromNow(-2),
  },
  {
    id: 3,
    type: 'team_invitation',
    title: 'Bạn nhận được lời mời vào nhóm',
    body: 'Nhóm Thư viện số mời bạn tham gia nhóm đồ án.',
    entity_type: 'team_invitation',
    entity_id: 1,
    actor_user_id: 6,
    is_read: 1,
    created_at: daysFromNow(-3),
  },
  {
    id: 4,
    type: 'task_assigned',
    title: 'Bạn được giao nhiệm vụ mới',
    body: 'Nhiệm vụ Dựng giao diện trang nhóm đã được giao cho bạn.',
    entity_type: 'task',
    entity_id: 4,
    actor_user_id: 1,
    is_read: 0,
    created_at: daysFromNow(-4),
  },
  {
    id: 5,
    type: 'task_deadline',
    title: 'Nhiệm vụ sắp đến hạn',
    body: 'Nhiệm vụ Viết tài liệu API nhóm sẽ đến hạn trong 3 ngày.',
    entity_type: 'task',
    entity_id: 3,
    actor_user_id: 1,
    is_read: 1,
    created_at: daysFromNow(-5),
  },
  {
    id: 6,
    type: 'report_feedback',
    title: 'Báo cáo có nhận xét mới',
    body: 'Giảng viên đã gửi nhận xét cho báo cáo giữa kỳ của nhóm.',
    entity_type: 'report',
    entity_id: 2,
    actor_user_id: 2,
    is_read: 0,
    created_at: daysFromNow(-6),
  },
  {
    id: 7,
    type: 'report_deadline',
    title: 'Nhắc hạn nộp báo cáo',
    body: 'Báo cáo cuối kỳ sẽ hết hạn nộp sau 10 ngày.',
    entity_type: 'report',
    entity_id: 3,
    actor_user_id: 2,
    is_read: 1,
    created_at: daysFromNow(-7),
  },
  {
    id: 8,
    type: 'semester_open',
    title: 'Đợt đồ án đang mở',
    body: 'Đợt đồ án học kỳ 1 năm 2026 đã mở đăng ký đề tài.',
    entity_type: 'project_round',
    entity_id: 1,
    actor_user_id: 3,
    is_read: 0,
    created_at: daysFromNow(-8),
  },
  {
    id: 9,
    type: 'team_request',
    title: 'Có yêu cầu tham gia nhóm',
    body: 'Một sinh viên đã gửi yêu cầu tham gia nhóm của bạn.',
    entity_type: 'team_request',
    entity_id: 1,
    actor_user_id: 8,
    is_read: 1,
    created_at: daysFromNow(-9),
  },
  {
    id: 10,
    type: 'system',
    title: 'Cập nhật lịch bảo vệ',
    body: 'Lịch bảo vệ đồ án đã được cập nhật trong hệ thống.',
    entity_type: 'defense_schedule',
    entity_id: 1,
    actor_user_id: 3,
    is_read: 0,
    created_at: daysFromNow(-10),
  },
]

function mapNotification(notification) {
  return {
    id: Number(notification.id),
    type: notification.type,
    title: notification.title,
    body: notification.body,
    entityType: notification.entity_type,
    entityId: notification.entity_id == null ? null : Number(notification.entity_id),
    isRead: Boolean(Number(notification.is_read)),
    createdAt: notification.created_at,
  }
}

const notificationApi = {
  async list(limit = 50) {
    if (useMock) {
      return mockResolve(
        mockNotifications
          .slice()
          .sort((left, right) => right.id - left.id)
          .slice(0, limit)
          .map(mapNotification),
      )
    }

    return (
      await unwrap(
        apiClient.get('/notifications.php', {
          params: { action: 'notifications', limit },
        }),
      )
    ).map(mapNotification)
  },

  async markRead(id) {
    if (useMock) {
      const notification = mockNotifications.find(
        (entry) => entry.id === Number(id),
      )
      if (!notification) {
        throw new Error('Không tìm thấy thông báo.')
      }

      notification.is_read = 1
      return mockResolve(undefined)
    }

    await unwrap(apiClient.patch('/notifications.php?action=read', { id }))
  },

  async markAllRead() {
    if (useMock) {
      const updated = mockNotifications.reduce((count, notification) => {
        if (notification.is_read === 0) {
          notification.is_read = 1
          return count + 1
        }
        return count
      }, 0)
      return mockResolve({ updated })
    }

    return unwrap(apiClient.patch('/notifications.php?action=read_all', {}))
  },
}

export default notificationApi
