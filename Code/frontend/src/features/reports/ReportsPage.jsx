import { useEffect, useRef, useState } from 'react'
import PageHeading from '../../components/PageHeading.jsx'
import reportApi from '../../api/reportApi.js'
import { useAuth } from '../../contexts/useAuth.js'

const reportTypes = {
  weekly: 'Hàng tuần',
  midterm: 'Giữa kỳ',
  final: 'Cuối kỳ',
  other: 'Khác',
}

function formatDate(value) {
  if (!value) {
    return 'Không có hạn'
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Ngày không hợp lệ'
    : date.toLocaleString('vi-VN')
}

function formatFileSize(size) {
  if (!size) {
    return '0 B'
  }
  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(
    Math.floor(Math.log(size) / Math.log(1024)),
    units.length - 1,
  )
  return `${(size / 1024 ** unitIndex).toFixed(unitIndex ? 1 : 0)} ${units[unitIndex]}`
}

function ReportsPage() {
  const { role } = useAuth()
  const [reports, setReports] = useState([])
  const [reportId, setReportId] = useState('')
  const [report, setReport] = useState(null)
  const [file, setFile] = useState(null)
  const [note, setNote] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    let active = true
    reportApi
      .listReports()
      .then((result) => {
        if (active) {
          setReports(result)
          setReportId(result[0] ? String(result[0].id) : '')
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || 'Không thể tải đợt báo cáo.')
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

  useEffect(() => {
    if (!reportId) {
      return undefined
    }
    let active = true
    reportApi
      .getReport(reportId)
      .then((result) => {
        if (active) {
          setReport(result)
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || 'Không thể tải chi tiết báo cáo.')
        }
      })
    return () => {
      active = false
    }
  }, [reportId])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!reportId || !file) {
      setError('Vui lòng chọn tệp báo cáo.')
      return
    }
    setError('')
    setSuccess('')
    setIsSubmitting(true)
    try {
      await reportApi.submitVersion(Number(reportId), { file, note: note.trim() })
      const updatedReport = await reportApi.getReport(reportId)
      setReport(updatedReport)
      setFile(null)
      setNote('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setSuccess('Đã nộp phiên bản báo cáo.')
    } catch (submitError) {
      setError(submitError.message || 'Không thể nộp báo cáo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedReport = reports.find((entry) => String(entry.id) === reportId)
  const isLoadingReport = Boolean(reportId) && report?.id !== Number(reportId)

  return (
    <section className="dashboard-page">
      <PageHeading
        title="Báo cáo"
        description="Nộp báo cáo theo đợt, xem các phiên bản và phản hồi của giảng viên."
        status={isLoading ? 'Đang tải' : `${reports.length} đợt báo cáo`}
      />
      {error && <p className="alert-error" role="alert">{error}</p>}
      {success && <p className="success-message" role="status">{success}</p>}
      {isLoading ? (
        <p role="status">Đang tải danh sách báo cáo...</p>
      ) : reports.length === 0 ? (
        <section className="workspace-panel">Chưa có đợt báo cáo.</section>
      ) : (
        <div className="reports-layout">
          <section className="report-list" aria-label="Các đợt báo cáo">
            {reports.map((entry) => (
              <button
                className={`report-option${String(entry.id) === reportId ? ' is-selected' : ''}`}
                key={entry.id}
                onClick={() => {
                  setError('')
                  setSuccess('')
                  setReportId(String(entry.id))
                }}
                type="button"
              >
                <strong>{entry.title}</strong>
                <span className="muted">{reportTypes[entry.reportType] || entry.reportType}</span>
                <span className="muted">Hạn: {formatDate(entry.deadline)}</span>
              </button>
            ))}
          </section>
          <section className="workspace-panel report-details">
            {isLoadingReport ? (
              <p role="status">Đang tải chi tiết báo cáo...</p>
            ) : report ? (
              <>
                <p className="eyebrow">{reportTypes[report.reportType] || report.reportType}</p>
                <h2>{report.title}</h2>
                <p className="muted">{report.description}</p>
                <p><strong>Hạn nộp:</strong> {formatDate(report.deadline)}</p>
                <p><strong>Trạng thái:</strong> {report.status === 'open' ? 'Đang mở' : report.status === 'graded' ? 'Đã chấm' : 'Đã đóng'}</p>
                {report.status === 'open' && role === 'STUDENT' && (
                  <form className="data-form" onSubmit={handleSubmit}>
                    <h3>Nộp phiên bản</h3>
                    <label className="field-control">
                      Tệp báo cáo
                      <input
                        accept=".pdf,.doc,.docx"
                        onChange={(event) => setFile(event.target.files?.[0] || null)}
                        ref={fileInputRef}
                        required
                        type="file"
                      />
                    </label>
                    <label className="field-control">
                      Ghi chú
                      <textarea
                        onChange={(event) => setNote(event.target.value)}
                        rows="2"
                        value={note}
                      />
                    </label>
                    <button disabled={isSubmitting} type="submit">
                      {isSubmitting ? 'Đang nộp...' : 'Nộp báo cáo'}
                    </button>
                  </form>
                )}
                <h3>Phiên bản đã nộp</h3>
                {report.versions?.length ? (
                  <ul className="report-version-list">
                    {report.versions.map((version) => (
                      <li key={version.id}>
                        <div>
                          <strong>Phiên bản {version.versionNo}: {version.originalFilename}</strong>
                          <p className="muted">
                            {formatDate(version.submittedAt)} · {formatFileSize(version.fileSize)}
                            {version.note ? ` · ${version.note}` : ''}
                          </p>
                        </div>
                        {version.feedback?.map((feedback) => (
                          <p className="feedback-note" key={feedback.id}>
                            {feedback.lecturerName}: {feedback.content}
                            {feedback.score != null ? ` · ${feedback.score}/10` : ''}
                          </p>
                        ))}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Chưa có phiên bản được nộp.</p>
                )}
              </>
            ) : (
              <p className="muted">{selectedReport?.title || 'Không tìm thấy báo cáo.'}</p>
            )}
          </section>
        </div>
      )}
    </section>
  )
}

export default ReportsPage
