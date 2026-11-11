import { useEffect, useState } from 'react'
import PageHeading from '../../components/PageHeading.jsx'
import notificationApi from '../../api/notificationApi.js'

function formatTime(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Không rõ thời gian'
    : date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
}

function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  async function loadNotifications() {
    setNotifications(await notificationApi.list())
  }

  useEffect(() => {
    let active = true
    notificationApi
      .list()
      .then((items) => {
        if (active) {
          setNotifications(items)
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || 'Không thể tải thông báo.')
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [])

  async function handleMarkRead(id) {
    setError('')
    try {
      await notificationApi.markRead(id)
      await loadNotifications()
    } catch (updateError) {
      setError(updateError.message || 'Không thể đánh dấu thông báo.')
    }
  }

  async function handleMarkAllRead() {
    setError('')
    try {
      await notificationApi.markAllRead()
      await loadNotifications()
    } catch (updateError) {
      setError(updateError.message || 'Không thể cập nhật thông báo.')
    }
  }

  const unreadCount = notifications.filter((notification) => !notification.isRead).length

  return (
    <section className="dashboard-page">
      <PageHeading
        title="Thông báo"
        description="Thông báo nhiệm vụ được giao, nhận xét báo cáo và lịch bảo vệ."
        status={`${unreadCount} chưa đọc`}
      />
      {error && <p className="alert-error" role="alert">{error}</p>}
      {unreadCount > 0 && (
        <button className="button-secondary" onClick={handleMarkAllRead} type="button">
          Đánh dấu tất cả đã đọc
        </button>
      )}
      {isLoading ? (
        <p role="status">Đang tải thông báo...</p>
      ) : notifications.length === 0 ? (
        <section className="workspace-panel teams-message">Bạn chưa có thông báo.</section>
      ) : (
        <section className="workspace-panel">
          <ul className="notification-list">
            {notifications.map((notification) => (
              <li className={notification.isRead ? '' : 'notification-unread'} key={notification.id}>
                <div>
                  <strong>{notification.title}</strong>
                  {notification.body && <p className="muted">{notification.body}</p>}
                  <time className="muted" dateTime={notification.createdAt}>{formatTime(notification.createdAt)}</time>
                </div>
                {!notification.isRead && (
                  <button className="button-secondary" onClick={() => handleMarkRead(notification.id)} type="button">
                    Đã đọc
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  )
}

export default NotificationsPage
