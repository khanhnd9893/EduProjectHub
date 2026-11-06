import { useEffect, useState } from 'react'
import PageHeading from '../../components/PageHeading.jsx'
import semesterApi from '../../api/semesterApi.js'

const semesterStatuses = {
  draft: 'Bản nháp',
  open: 'Đang mở',
  in_progress: 'Đang diễn ra',
  closed: 'Đã đóng',
}

function formatDate(value) {
  if (!value) {
    return 'Chưa thiết lập'
  }
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? 'Ngày không hợp lệ'
    : date.toLocaleDateString('vi-VN')
}

function SemestersPage() {
  const [semesters, setSemesters] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    semesterApi
      .listSemesters()
      .then((result) => {
        if (active) {
          setSemesters(result)
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || 'Không thể tải danh sách học kỳ.')
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
        eyebrow="Quản trị"
        title="Quản lý học kỳ"
        description="Danh sách học kỳ/đợt đồ án hiện có."
        status={isLoading ? 'Đang tải' : 'Chỉ ADMIN'}
      />
      {error && <p className="alert-error" role="alert">{error}</p>}
      {isLoading ? (
        <p role="status">Đang tải học kỳ...</p>
      ) : semesters.length ? (
        <div className="semester-grid">
          {semesters.map((semester) => (
            <article className="workspace-panel semester-card" key={semester.id}>
              <p className="eyebrow">{semester.roundCode}</p>
              <h2>{semester.roundName}</h2>
              <span className="status-chip">
                {semesterStatuses[semester.status] || semester.status}
              </span>
              <dl className="semester-metadata">
                <div>
                  <dt>Năm học</dt>
                  <dd>{semester.academicYear || 'Chưa thiết lập'}</dd>
                </div>
                <div>
                  <dt>Thời gian</dt>
                  <dd>{formatDate(semester.startDate)} – {formatDate(semester.endDate)}</dd>
                </div>
                <div>
                  <dt>Sĩ số nhóm</dt>
                  <dd>{semester.minMembers}–{semester.maxMembers} thành viên</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <section className="workspace-panel">
          Chưa có dữ liệu học kỳ. API PHP quản lý học kỳ chưa được triển khai.
        </section>
      )}
    </section>
  )
}

export default SemestersPage
