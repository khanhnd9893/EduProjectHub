import apiClient from './client.js'
import { unwrap } from './response.js'

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
    return (
      await unwrap(
        apiClient.get('/notifications.php', {
          params: { action: 'notifications', limit },
        }),
      )
    ).map(mapNotification)
  },

  async markRead(id) {
    await unwrap(apiClient.patch('/notifications.php?action=read', { id }))
  },

  async markAllRead() {
    return unwrap(apiClient.patch('/notifications.php?action=read_all', {}))
  },
}

export default notificationApi
