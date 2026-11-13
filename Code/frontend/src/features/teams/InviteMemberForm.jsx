import { useEffect, useState } from 'react'
import teamApi from '../../api/teamApi.js'

// Trưởng nhóm mời sinh viên; sinh viên chỉ vào nhóm khi chấp nhận lời mời.
function InviteMemberForm({ teamId }) {
  const [students, setStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let isCurrent = true

    teamApi
      .listAvailableStudents(teamId)
      .then((result) => {
        if (isCurrent) {
          setStudents(result)
          setSelectedStudentId(result[0]?.id?.toString() || '')
        }
      })
      .catch((loadError) => {
        if (isCurrent) {
          setError(loadError.message || 'Không thể tải danh sách sinh viên.')
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [teamId])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!selectedStudentId) {
      return
    }

    const student = students.find(
      (entry) => entry.id === Number(selectedStudentId),
    )
    setError('')
    setSuccess('')
    setIsSending(true)
    try {
      await teamApi.sendInvitation(teamId, {
        invitedUserId: Number(selectedStudentId),
        message: message.trim(),
      })
      setSuccess(
        `Đã gửi lời mời tới ${student?.fullName}. Sinh viên sẽ vào nhóm khi chấp nhận.`,
      )
      setMessage('')
    } catch (sendError) {
      setError(sendError.message || 'Không thể gửi lời mời.')
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <p className="muted" role="status">
        Đang tải danh sách sinh viên...
      </p>
    )
  }

  return (
    <form className="data-form" onSubmit={handleSubmit}>
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
      <label className="field-control">
        Sinh viên chưa thuộc nhóm nào trong đợt này
        <select
          onChange={(event) => setSelectedStudentId(event.target.value)}
          required
          value={selectedStudentId}
        >
          {students.length === 0 ? (
            <option value="">Không còn sinh viên phù hợp để mời</option>
          ) : (
            students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.studentCode ? `${student.studentCode} - ` : ''}
                {student.fullName}
              </option>
            ))
          )}
        </select>
      </label>
      <label className="field-control">
        Lời nhắn (không bắt buộc)
        <textarea
          maxLength={500}
          onChange={(event) => setMessage(event.target.value)}
          rows="2"
          value={message}
        />
      </label>
      <button disabled={isSending || students.length === 0} type="submit">
        {isSending ? 'Đang gửi...' : 'Gửi lời mời'}
      </button>
    </form>
  )
}

export default InviteMemberForm
