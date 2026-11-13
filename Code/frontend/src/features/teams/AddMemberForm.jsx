import { useEffect, useState } from 'react'
import teamApi from '../../api/teamApi.js'

function AddMemberForm({ teamId, onAdded }) {
  const [students, setStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
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
    setIsAdding(true)
    try {
      await teamApi.addMember(teamId, Number(selectedStudentId))
      setSuccess(`Đã thêm ${student?.fullName} vào nhóm.`)
      try {
        const availableStudents = await teamApi.listAvailableStudents(teamId)
        setStudents(availableStudents)
        setSelectedStudentId(availableStudents[0]?.id?.toString() || '')
        await onAdded()
      } catch (refreshError) {
        setError(
          `Đã thêm thành viên nhưng không thể làm mới dữ liệu nhóm: ${refreshError.message}`,
        )
      }
    } catch (addError) {
      setError(addError.message || 'Không thể thêm sinh viên vào nhóm.')
    } finally {
      setIsAdding(false)
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
        Thêm trực tiếp sinh viên chưa thuộc nhóm nào trong đợt này
        <select
          disabled={students.length === 0}
          onChange={(event) => setSelectedStudentId(event.target.value)}
          required
          value={selectedStudentId}
        >
          {students.length === 0 ? (
            <option value="">Không còn sinh viên phù hợp</option>
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
      <button disabled={isAdding || students.length === 0} type="submit">
        {isAdding ? 'Đang thêm...' : 'Thêm vào nhóm'}
      </button>
    </form>
  )
}

export default AddMemberForm
