import { useEffect, useState } from 'react'
import teamApi from '../../api/teamApi.js'

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('vi-VN') : ''
}

// Trưởng nhóm duyệt hoặc từ chối yêu cầu tham gia đang chờ của nhóm.
function JoinRequestsPanel({ teamId, onApproved }) {
  const [requests, setRequests] = useState([])
  const [reviewingId, setReviewingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let isCurrent = true

    teamApi
      .listRequests(teamId)
      .then((result) => {
        if (isCurrent) {
          setRequests(result)
        }
      })
      .catch((loadError) => {
        if (isCurrent) {
          setError(loadError.message || 'Không thể tải yêu cầu tham gia.')
        }
      })

    return () => {
      isCurrent = false
    }
  }, [teamId])

  async function handleReview(request, status) {
    setError('')
    setSuccess('')
    setReviewingId(request.id)
    try {
      await teamApi.reviewRequest(request.id, { status, reviewNote: '' })
      setRequests(await teamApi.listRequests(teamId))
      if (status === 'approved') {
        setSuccess(`Đã duyệt ${request.fullName} vào nhóm.`)
        await onApproved()
      } else {
        setSuccess(`Đã từ chối yêu cầu của ${request.fullName}.`)
      }
    } catch (reviewError) {
      setError(reviewError.message || 'Không thể xử lý yêu cầu.')
    } finally {
      setReviewingId(null)
    }
  }

  const pendingRequests = requests.filter(
    (request) => request.status === 'pending',
  )

  return (
    <section aria-live="polite">
      <h3>Yêu cầu tham gia đang chờ ({pendingRequests.length})</h3>
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
      {pendingRequests.length === 0 ? (
        <p className="muted">Chưa có yêu cầu nào đang chờ duyệt.</p>
      ) : (
        <ul className="team-members">
          {pendingRequests.map((request) => (
            <li key={request.id}>
              <span>
                <strong>{request.fullName}</strong>
                <span className="muted">
                  {request.message && ` · ${request.message}`}
                  {` · gửi ${formatDate(request.requestedAt)}`}
                </span>
              </span>
              <span className="invitation-actions">
                <button
                  className="button-secondary"
                  disabled={reviewingId !== null}
                  onClick={() => handleReview(request, 'approved')}
                  type="button"
                >
                  Duyệt
                </button>
                <button
                  className="button-secondary"
                  disabled={reviewingId !== null}
                  onClick={() => handleReview(request, 'rejected')}
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

export default JoinRequestsPanel
