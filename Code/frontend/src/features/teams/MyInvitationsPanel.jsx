import { useEffect, useState } from 'react'
import teamApi from '../../api/teamApi.js'

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('vi-VN') : ''
}

// Lời mời vào nhóm mà sinh viên đang đăng nhập nhận được; chỉ hiện khi còn lời mời chờ phản hồi.
function MyInvitationsPanel({ onAccepted }) {
  const [invitations, setInvitations] = useState([])
  const [respondingId, setRespondingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let isCurrent = true

    teamApi
      .listInvitations()
      .then((result) => {
        if (isCurrent) {
          setInvitations(result)
        }
      })
      .catch((loadError) => {
        if (isCurrent) {
          setError(loadError.message || 'Không thể tải lời mời nhóm.')
        }
      })

    return () => {
      isCurrent = false
    }
  }, [])

  async function handleRespond(invitation, status) {
    setError('')
    setSuccess('')
    setRespondingId(invitation.id)
    try {
      await teamApi.respondInvitation(invitation.id, { status })
      setInvitations(await teamApi.listInvitations())
      if (status === 'accepted') {
        setSuccess(`Bạn đã tham gia ${invitation.groupName}.`)
        await onAccepted(invitation.groupId)
      } else {
        setSuccess(`Đã từ chối lời mời của ${invitation.groupName}.`)
      }
    } catch (respondError) {
      setError(respondError.message || 'Không thể phản hồi lời mời.')
    } finally {
      setRespondingId(null)
    }
  }

  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === 'pending',
  )

  if (pendingInvitations.length === 0 && !error && !success) {
    return null
  }

  return (
    <section className="workspace-panel teams-message" aria-live="polite">
      <h2>Lời mời của tôi ({pendingInvitations.length})</h2>
      {error && (
        <p className="alert-error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="success-message" role="status">
          {success}
        </p>
      )}
      {pendingInvitations.length > 0 && (
        <ul className="team-members">
          {pendingInvitations.map((invitation) => (
            <li key={invitation.id}>
              <span>
                <strong>{invitation.groupName}</strong>
                <span className="muted">
                  {invitation.message && ` · ${invitation.message}`}
                  {` · gửi ${formatDate(invitation.sentAt)}`}
                  {invitation.expiresAt &&
                    ` · hết hạn ${formatDate(invitation.expiresAt)}`}
                </span>
              </span>
              <span className="invitation-actions">
                <button
                  className="button-secondary"
                  disabled={respondingId !== null}
                  onClick={() => handleRespond(invitation, 'accepted')}
                  type="button"
                >
                  Chấp nhận
                </button>
                <button
                  className="button-secondary"
                  disabled={respondingId !== null}
                  onClick={() => handleRespond(invitation, 'rejected')}
                  type="button"
                >
                  Từ chối
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default MyInvitationsPanel
