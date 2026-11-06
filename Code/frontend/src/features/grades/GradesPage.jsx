import { useEffect, useState } from 'react'
import PageHeading from '../../components/PageHeading.jsx'
import reportApi from '../../api/reportApi.js'

function formatDate(value) {
  if (!value) {
    return 'Chưa công bố'
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Ngày không hợp lệ'
    : date.toLocaleDateString('vi-VN')
}

function GradesPage() {
  const [grades, setGrades] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    reportApi
      .listGrades()
      .then((result) => {
        if (active) {
          setGrades(result)
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || 'Không thể tải điểm số.')
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

  return (
    <section className="dashboard-page">
      <PageHeading
        title="Điểm số"
        description="Xem điểm tổng kết đồ án đã được công bố."
        status={isLoading ? 'Đang tải' : `${grades.length} kết quả`}
      />
      {error && <p className="alert-error" role="alert">{error}</p>}
      {isLoading ? (
        <p role="status">Đang tải điểm số...</p>
      ) : grades.length ? (
        <div className="grade-grid">
          {grades.map((grade) => (
            <article
              className="workspace-panel grade-card"
              key={`${grade.groupId}-${grade.studentId}`}
            >
              <p className="eyebrow">
                {grade.status === 'published' ? 'Đã công bố' : 'Bản nháp'}
              </p>
              <h2>{grade.groupName}</h2>
              {grade.studentName && <p className="muted">{grade.studentName}</p>}
              <strong className="grade-score">{Number(grade.totalScore).toFixed(2)} / 10</strong>
              <p className="muted">{grade.note || 'Không có nhận xét.'}</p>
              <small className="muted">
                Ngày công bố: {formatDate(grade.publishedAt)}
              </small>
            </article>
          ))}
        </div>
      ) : (
        <section className="workspace-panel">
          Chưa có điểm nào được công bố.
        </section>
      )}
    </section>
  )
}

export default GradesPage
