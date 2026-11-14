import { useEffect, useRef, useState } from 'react'
import PageHeading from '../../components/PageHeading.jsx'
import reportApi from '../../api/reportApi.js'
import { useAuth } from '../../contexts/useAuth.js'
import { isStudentRole } from '../../utils/roles.js'

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

// Giới hạn khớp với kiểm tra trong Code/Backend/reports.php.
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx']
const MAX_FILE_SIZE = 10 * 1024 * 1024
const FILE_RULE_TEXT = 'Định dạng PDF, DOC, DOCX · tối đa 10 MB'
const DAY_MS = 24 * 60 * 60 * 1000

function validateReportFile(file) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return 'Sai định dạng tệp. Chỉ chấp nhận PDF, DOC hoặc DOCX.'
  }
  if (file.size === 0 || file.size > MAX_FILE_SIZE) {
    return 'Tệp phải có dung lượng từ 1 byte đến 10 MB.'
  }
  return ''
}

function describeDeadline(deadline, now = new Date()) {
  if (!deadline) {
    return ''
  }
  const time = new Date(deadline).getTime()
  if (Number.isNaN(time)) {
    return ''
  }
  if (time < now.getTime()) {
    return `quá hạn ${Math.max(1, Math.floor((now.getTime() - time) / DAY_MS))} ngày`
  }
  const days = Math.ceil((time - now.getTime()) / DAY_MS)
  return days <= 1 ? 'hết hạn trong hôm nay' : `còn ${days} ngày`
}

// Mốc đang mở có hạn gần nhất chưa qua, dùng cho khối "Sắp đến hạn".
function findUpcomingReport(reports, now = new Date()) {
  return reports
    .filter(
      (entry) =>
        entry.status === 'open' &&
        entry.deadline &&
        new Date(entry.deadline).getTime() >= now.getTime(),
    )
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0]
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
  const [fileError, setFileError] = useState('')
  const [note, setNote] = useState('')
  const [feedbackDrafts, setFeedbackDrafts] = useState({})
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef(null)
  const submitFormRef = useRef(null)

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
    if (fileError) {
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

  async function handleFeedbackSubmit(event, versionId) {
    event.preventDefault()
    const draft = feedbackDrafts[versionId] || { content: '', score: '' }
    setError('')
    setSuccess('')
    setIsSubmittingFeedback(true)
    try {
      await reportApi.addFeedback(versionId, draft)
      setReport(await reportApi.getReport(reportId))
      setFeedbackDrafts((current) => ({
        ...current,
        [versionId]: { content: '', score: '' },
      }))
      setSuccess('Đã gửi nhận xét và điểm báo cáo.')
    } catch (feedbackError) {
      setError(feedbackError.message || 'Không thể gửi nhận xét.')
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0] || null
    setFile(selectedFile)
    setFileError(selectedFile ? validateReportFile(selectedFile) : '')
  }

  function selectReport(id) {
    setError('')
    setSuccess('')
    setFile(null)
    setFileError('')
    setReportId(String(id))
  }

  function openUpcomingSubmit(id) {
    selectReport(id)
    window.setTimeout(() => {
      submitFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 300)
  }

  const selectedReport = reports.find((entry) => String(entry.id) === reportId)
  const upcomingReport = findUpcomingReport(reports)
  const sortedVersions = [...(report?.versions ?? [])].sort(
    (a, b) => b.versionNo - a.versionNo,
  )
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
        <>
        {upcomingReport && (
          <section className="workspace-panel report-upcoming">
            <div>
              <p className="eyebrow">Sắp đến hạn</p>
              <h2>{upcomingReport.title}</h2>
              <p className="muted">
                Hạn: {formatDate(upcomingReport.deadline)} ·{' '}
                {describeDeadline(upcomingReport.deadline)} · {FILE_RULE_TEXT}
              </p>
            </div>
            <button
              onClick={() =>
                isStudentRole(role)
                  ? openUpcomingSubmit(upcomingReport.id)
                  : selectReport(upcomingReport.id)
              }
              type="button"
            >
              {isStudentRole(role) ? 'Nộp báo cáo' : 'Xem chi tiết'}
            </button>
          </section>
        )}
        <div className="reports-layout">
          <section className="report-list" aria-label="Các đợt báo cáo">
            {reports.map((entry) => (
              <button
                className={`report-option${String(entry.id) === reportId ? ' is-selected' : ''}`}
                key={entry.id}
                onClick={() => selectReport(entry.id)}
                type="button"
              >
                <strong>{entry.title}</strong>
                <span className="muted">{reportTypes[entry.reportType] || entry.reportType}</span>
                <span className="muted">
                  Hạn: {formatDate(entry.deadline)}
                  {entry.status === 'open' && entry.deadline
                    ? ` · ${describeDeadline(entry.deadline)}`
                    : ''}
                </span>
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
                <p>
                  <strong>Hạn nộp:</strong> {formatDate(report.deadline)}
                  {report.status === 'open' && report.deadline
                    ? ` · ${describeDeadline(report.deadline)}`
                    : ''}
                </p>
                <p><strong>Trạng thái:</strong> {report.status === 'open' ? 'Đang mở' : report.status === 'graded' ? 'Đã chấm' : 'Đã đóng'}</p>
                {report.status === 'open' && isStudentRole(role) && (
                  <form className="data-form" onSubmit={handleSubmit} ref={submitFormRef}>
                    <h3>Nộp phiên bản</h3>
                    <label className="field-control">
                      Tệp báo cáo
                      <input
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        required
                        type="file"
                      />
                      <span className="muted">{FILE_RULE_TEXT}</span>
                    </label>
                    {fileError && (
                      <p className="alert-error" role="alert">
                        {fileError}
                      </p>
                    )}
                    <label className="field-control">
                      Ghi chú
                      <textarea
                        onChange={(event) => setNote(event.target.value)}
                        rows="2"
                        value={note}
                      />
                    </label>
                    <button disabled={isSubmitting || Boolean(fileError)} type="submit">
                      {isSubmitting ? 'Đang nộp...' : 'Nộp báo cáo'}
                    </button>
                  </form>
                )}
                <h3>Lịch sử nộp ({sortedVersions.length} phiên bản)</h3>
                {sortedVersions.length ? (
                  <ul className="report-version-list">
                    {sortedVersions.map((version, index) => (
                      <li key={version.id}>
                        <div>
                          <strong>Phiên bản {version.versionNo}: {version.originalFilename}</strong>{' '}
                          <span className="status-chip report-version-chip">
                            {index === 0 ? 'Mới nhất' : 'Đã thay thế'}
                          </span>
                          <p className="muted">
                            {formatDate(version.submittedAt)} · {formatFileSize(version.fileSize)}
                            {version.note ? ` · ${version.note}` : ''}
                          </p>
                        </div>
                        {version.feedback?.map((feedback) => (
                          <div className="feedback-note report-feedback" key={feedback.id}>
                            <div>
                              <strong>{feedback.lecturerName}</strong>
                              <p>{feedback.content}</p>
                            </div>
                            {feedback.score != null && (
                              <span className="report-feedback-score">
                                {Number(feedback.score).toFixed(1)}/10
                              </span>
                            )}
                          </div>
                        ))}
                        {role === 'LECTURER' && (
                          <form
                            className="data-form report-feedback-form"
                            onSubmit={(event) => handleFeedbackSubmit(event, version.id)}
                          >
                            <label className="field-control">
                              Nhận xét
                              <textarea
                                onChange={(event) => setFeedbackDrafts((current) => ({
                                  ...current,
                                  [version.id]: {
                                    ...current[version.id],
                                    content: event.target.value,
                                  },
                                }))}
                                required
                                rows="2"
                                value={feedbackDrafts[version.id]?.content || ''}
                              />
                            </label>
                            <label className="field-control">
                              Điểm (0–10, tùy chọn)
                              <input
                                max="10"
                                min="0"
                                onChange={(event) => setFeedbackDrafts((current) => ({
                                  ...current,
                                  [version.id]: {
                                    ...current[version.id],
                                    score: event.target.value,
                                  },
                                }))}
                                step="0.1"
                                type="number"
                                value={feedbackDrafts[version.id]?.score || ''}
                              />
                            </label>
                            <button disabled={isSubmittingFeedback} type="submit">
                              {isSubmittingFeedback ? 'Đang gửi...' : 'Gửi nhận xét'}
                            </button>
                          </form>
                        )}
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
        </>
      )}
    </section>
  )
}

export default ReportsPage
