import { useEffect, useRef, useState } from 'react'
import PageHeading from '../../components/PageHeading.jsx'
import ReportsCalendar from './ReportsCalendar.jsx'
import reportApi from '../../api/reportApi.js'
import teamApi from '../../api/teamApi.js'
import { useAuth } from '../../contexts/useAuth.js'
import { isAcademicManagerRole, isStudentRole } from '../../utils/roles.js'

const reportTypes = {
  weekly: 'Hàng tuần',
  midterm: 'Giữa kỳ',
  final: 'Cuối kỳ',
  other: 'Khác',
}

const emptyReportForm = {
  groupId: '',
  title: '',
  reportType: 'other',
  description: '',
  deadline: '',
  status: 'open',
}

function formatDate(value) {
  if (!value) {
    return 'Không có hạn'
  }
  const date = new Date(value.replace(' ', 'T'))
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
  const time = new Date(deadline.replace(' ', 'T')).getTime()
  if (Number.isNaN(time)) {
    return ''
  }
  if (time < now.getTime()) {
    return `quá hạn ${Math.max(1, Math.floor((now.getTime() - time) / DAY_MS))} ngày`
  }
  const days = Math.ceil((time - now.getTime()) / DAY_MS)
  return days <= 1 ? 'hết hạn trong hôm nay' : `còn ${days} ngày`
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
  const [search, setSearch] = useState('')
  const [submissionFilter, setSubmissionFilter] = useState('all')
  const [view, setView] = useState('calendar')
  const [focusDeadline, setFocusDeadline] = useState(null)
  const [detailError, setDetailError] = useState('')
  const [detailRequest, setDetailRequest] = useState(0)
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [note, setNote] = useState('')
  const [feedbackDrafts, setFeedbackDrafts] = useState({})
  const [downloadingVersionId, setDownloadingVersionId] = useState(null)
  const [downloadError, setDownloadError] = useState(null)
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [teams, setTeams] = useState([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(true)
  const [teamError, setTeamError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingReport, setEditingReport] = useState(null)
  const [reportForm, setReportForm] = useState(emptyReportForm)
  const [isSavingReport, setIsSavingReport] = useState(false)
  const canManageReports = isAcademicManagerRole(role)
  const fileInputRef = useRef(null)
  const detailRef = useRef(null)
  const reportFormRef = useRef(null)

  useEffect(() => {
    let active = true
    reportApi
      .listReports()
      .then((result) => {
        if (active) {
          setReports(result)
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
    if (!canManageReports) {
      return undefined
    }
    let active = true
    teamApi.listTeams()
      .then((result) => {
        if (active) {
          setTeams(result.filter((team) => team.status !== 'dissolved'))
          setTeamError('')
        }
      })
      .catch((loadError) => {
        if (active) {
          setTeamError(loadError.message || 'Không thể tải danh sách nhóm.')
        }
      })
      .finally(() => {
        if (active) setIsLoadingTeams(false)
      })
    return () => { active = false }
  }, [canManageReports])

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
          setDetailError(loadError.message || 'Không thể tải chi tiết báo cáo.')
        }
      })
    return () => {
      active = false
    }
  }, [reportId, detailRequest])

  function openReportForm(entry = null) {
    setEditingReport(entry)
    setReportForm(entry ? {
      groupId: String(entry.groupId),
      title: entry.title,
      reportType: entry.reportType,
      description: entry.description || '',
      deadline: entry.deadline ? entry.deadline.replace(' ', 'T') : '',
      status: entry.status,
    } : emptyReportForm)
    setError('')
    setSuccess('')
    setIsFormOpen(true)
  }

  async function handleReportSave(event) {
    event.preventDefault()
    const title = reportForm.title.trim()
    if (!title || !reportForm.groupId) {
      setError('Vui lòng chọn nhóm và nhập tên đợt báo cáo.')
      return
    }
    setError('')
    setSuccess('')
    setIsSavingReport(true)
    let savedId
    try {
      const values = {
        ...reportForm,
        title,
        description: reportForm.description.trim(),
        groupName: teams.find((team) => team.id === Number(reportForm.groupId))?.groupName,
      }
      if (editingReport) {
        await reportApi.updateReport(editingReport.id, values)
        savedId = editingReport.id
      } else {
        const created = await reportApi.createReport(values)
        savedId = created.id
      }
    } catch (saveError) {
      setError(saveError.message || 'Không thể lưu đợt báo cáo.')
      setIsSavingReport(false)
      return
    }
    setIsFormOpen(false)
    setSuccess(editingReport ? 'Đã cập nhật đợt báo cáo.' : 'Đã tạo đợt báo cáo.')
    try {
      const updatedReports = await reportApi.listReports()
      setReports(updatedReports)
      const savedReport = updatedReports.find((entry) => entry.id === savedId)
      if (savedReport?.deadline) {
        setFocusDeadline((current) => ({ value: savedReport.deadline, revision: (current?.revision || 0) + 1 }))
      }
      if (editingReport) {
        setReport(await reportApi.getReport(savedId))
      }
    } catch (loadError) {
      setError(loadError.message || 'Đã lưu nhưng không thể tải lại danh sách báo cáo.')
    } finally {
      setIsSavingReport(false)
    }
  }

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
    } catch (submitError) {
      setError(submitError.message || 'Không thể nộp báo cáo.')
      setIsSubmitting(false)
      return
    }
    setReports((current) => current.map((entry) =>
      entry.id === Number(reportId) ? { ...entry, hasSubmission: true } : entry,
    ))
    setFile(null)
    setNote('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setSuccess('Đã nộp phiên bản báo cáo.')
    try {
      setReport(await reportApi.getReport(reportId))
    } catch (loadError) {
      setDetailError(`Đã nộp báo cáo nhưng không thể tải lại chi tiết: ${loadError.message || 'Lỗi không xác định'}. Bấm Xem chi tiết để thử lại.`)
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

  async function handleDownload(version) {
    setDownloadError(null)
    setDownloadingVersionId(version.id)
    try {
      const file = await reportApi.downloadVersion(version.id)
      const url = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url
      link.download = version.originalFilename
      document.body.appendChild(link)
      try {
        link.click()
      } finally {
        link.remove()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
    } catch (error) {
      setDownloadError({ versionId: version.id, message: error.message || 'Không thể tải tệp báo cáo.' })
    } finally {
      setDownloadingVersionId(null)
    }
  }

  function chooseFile(selectedFile) {
    setFile(selectedFile)
    setFileError(selectedFile ? validateReportFile(selectedFile) : '')
  }

  function handleFileDrop(event) {
    event.preventDefault()
    const files = event.dataTransfer.files
    if (files.length !== 1) {
      chooseFile(null)
      setFileError('Vui lòng chọn một tệp báo cáo.')
      return
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
    chooseFile(files[0])
  }

  function selectReport(id) {
    setError('')
    setSuccess('')
    setFile(null)
    setFileError('')
    setNote('')
    setDetailError('')
    setDownloadError(null)
    setReport(null)
    setReportId(String(id))
    setDetailRequest((current) => current + 1)
  }

  function selectCalendarReport(id) {
    selectReport(id)
    window.requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function createCalendarReport() {
    openReportForm()
    window.requestAnimationFrame(() => reportFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const selectedReport = reports.find((entry) => String(entry.id) === reportId)
  const visibleReports = reports.filter((entry) => {
    const matchesSearch = `${entry.title} ${entry.groupName || ''}`.toLocaleLowerCase('vi')
      .includes(search.trim().toLocaleLowerCase('vi'))
    return matchesSearch && (
      submissionFilter === 'all' ||
      (submissionFilter === 'submitted' ? entry.hasSubmission : !entry.hasSubmission)
    )
  })
  const sortedVersions = [...(report?.versions ?? [])].sort(
    (a, b) => b.versionNo - a.versionNo,
  )
  const isSelectedReportVisible = visibleReports.some((entry) => String(entry.id) === reportId)
  const isLoadingReport = Boolean(reportId) && report?.id !== Number(reportId)

  return (
    <section className="dashboard-page reports-page">
      <PageHeading
        title="Báo cáo"
        description={isStudentRole(role)
          ? 'Nộp báo cáo theo đợt và theo dõi phản hồi của giảng viên.'
          : role === 'LECTURER'
            ? 'Xem báo cáo của nhóm hướng dẫn và gửi nhận xét.'
            : canManageReports
              ? 'Tạo, quản lý các đợt báo cáo và theo dõi bài nộp.'
              : 'Xem các đợt báo cáo và bài nộp.'}
        status={isLoading ? 'Đang tải' : `${reports.length} đợt báo cáo`}
      />
      {error && <p className="alert-error" role="alert">{error}</p>}
      {success && <p className="success-message" role="status">{success}</p>}
      {canManageReports && (view === 'list' || isFormOpen || reports.length === 0) && (
        <section className="workspace-panel" ref={reportFormRef}>
          {view === 'list' || reports.length === 0 ? (
          <button className="report-action report-action-primary" type="button" onClick={() => openReportForm()}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Tạo đợt báo cáo
          </button>
          ) : null}
          {isFormOpen && (
            <form className="data-form" onSubmit={handleReportSave}>
              <h2>{editingReport ? 'Chỉnh sửa đợt báo cáo' : 'Tạo đợt báo cáo'}</h2>
              {teamError && !editingReport && <p className="alert-error" role="alert">{teamError}</p>}
              <label className="field-control">
                Nhóm
                <select
                  disabled={Boolean(editingReport) || isLoadingTeams}
                  onChange={(event) => setReportForm((current) => ({ ...current, groupId: event.target.value }))}
                  required
                  value={reportForm.groupId}
                >
                  <option value="">Chọn nhóm</option>
                  {editingReport && !teams.some((team) => team.id === editingReport.groupId) && (
                    <option value={editingReport.groupId}>{editingReport.groupName}</option>
                  )}
                  {teams.map((team) => <option key={team.id} value={team.id}>{team.groupCode} — {team.groupName}</option>)}
                </select>
              </label>
              <label className="field-control">
                Tên đợt báo cáo
                <input maxLength="255" required value={reportForm.title}
                  onChange={(event) => setReportForm((current) => ({ ...current, title: event.target.value }))} />
              </label>
              <label className="field-control">
                Loại báo cáo
                <select value={reportForm.reportType}
                  onChange={(event) => setReportForm((current) => ({ ...current, reportType: event.target.value }))}>
                  {Object.entries(reportTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="field-control">
                Mô tả
                <textarea maxLength="5000" rows="2" value={reportForm.description}
                  onChange={(event) => setReportForm((current) => ({ ...current, description: event.target.value }))} />
              </label>
              <label className="field-control">
                Hạn nộp (tùy chọn)
                <input type="datetime-local" step="1" value={reportForm.deadline}
                  onChange={(event) => setReportForm((current) => ({ ...current, deadline: event.target.value }))} />
              </label>
              <label className="field-control">
                Trạng thái
                <select value={reportForm.status}
                  onChange={(event) => setReportForm((current) => ({ ...current, status: event.target.value }))}>
                  <option value="open">Đang mở</option>
                  <option value="closed">Đã đóng</option>
                  {editingReport && <option value="graded">Đã chấm</option>}
                </select>
              </label>
              <button disabled={isSavingReport || (!editingReport && (isLoadingTeams || Boolean(teamError)))} type="submit">
                {isSavingReport ? 'Đang lưu...' : 'Lưu đợt báo cáo'}
              </button>
              <button className="button-secondary" disabled={isSavingReport} onClick={() => setIsFormOpen(false)} type="button">
                Hủy
              </button>
            </form>
          )}
        </section>
      )}
      {!isLoading && reports.length > 0 && (
        <div className="reports-toolbar">
          <label className="reports-search">
            <span className="reports-search-label">Tìm báo cáo</span>
            <input type="search" placeholder="Tìm kiếm báo cáo hoặc nhóm"
              value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <div className="reports-filters" role="group" aria-label="Lọc theo bài nộp của nhóm">
            {[['all', 'Tất cả'], ['submitted', 'Đã nộp'], ['missing', 'Chưa nộp']].map(([value, label]) => (
              <button key={value} type="button" aria-pressed={submissionFilter === value}
                onClick={() => setSubmissionFilter(value)}>{label}</button>
            ))}
          </div>
          <div className="reports-filters reports-view-toggle" role="group" aria-label="Chế độ xem báo cáo">
            {[['calendar', 'Lịch'], ['list', 'Danh sách']].map(([value, label]) => (
              <button key={value} type="button" aria-pressed={view === value} onClick={() => setView(value)}>{label}</button>
            ))}
          </div>
        </div>
      )}
      {isLoading ? (
        <p role="status">Đang tải danh sách báo cáo...</p>
      ) : reports.length === 0 ? (
        <section className="workspace-panel">Chưa có đợt báo cáo.</section>
      ) : (
        <div className={view === 'list' ? 'reports-layout' : `reports-calendar-view${reportId ? ' has-detail' : ''}`}>
        {view === 'calendar' && (
          <ReportsCalendar key={focusDeadline?.revision || 0} reports={visibleReports} selectedId={reportId} onSelect={selectCalendarReport}
            onShowList={() => setView('list')} onCreate={canManageReports ? createCalendarReport : undefined}
            disabled={isSubmitting} focusDeadline={focusDeadline} />
        )}
          {view === 'list' && <section className="report-list" aria-label="Các đợt báo cáo">
            {visibleReports.length === 0 && <p className="muted">Không tìm thấy đợt báo cáo phù hợp.</p>}
            {visibleReports.map((entry) => (
              <article
                className={`report-option${String(entry.id) === reportId ? ' is-selected' : ''}`}
                key={entry.id}
              >
                <div className="report-option-heading">
                  <strong>{entry.title}</strong>
                  <span className="report-type-badge">{reportTypes[entry.reportType] || entry.reportType}</span>
                </div>
                {entry.groupName && <span className="muted">Nhóm: {entry.groupName}</span>}
                <span className={`report-submission-badge ${entry.hasSubmission ? 'is-submitted' : 'is-missing'}`}>
                  {entry.hasSubmission ? 'Đã nộp' : 'Chưa nộp'}
                </span>
                <span className="muted">
                  Hạn: {formatDate(entry.deadline)}
                  {entry.status === 'open' && entry.deadline
                    ? ` · ${describeDeadline(entry.deadline)}`
                    : ''}
                </span>
                <button className="report-action report-action-secondary" disabled={isSubmitting} onClick={() => selectReport(entry.id)} type="button">
                  Xem chi tiết
                </button>
              </article>
            ))}
          </section>}
          {(view === 'list' || reportId) && <section className="workspace-panel report-details" ref={detailRef}>
            {!reportId ? (
              <p className="muted">Chọn “Xem chi tiết” để xem nội dung báo cáo.</p>
            ) : !isSelectedReportVisible ? (
              <p className="muted">Báo cáo đang xem không phù hợp với bộ lọc. Chọn “Xem chi tiết” trong danh sách để xem báo cáo khác.</p>
            ) : detailError ? (
              <p className="alert-error" role="alert">{detailError}</p>
            ) : isLoadingReport ? (
              <p role="status">Đang tải chi tiết báo cáo...</p>
            ) : report ? (
              <>
                <p className="eyebrow">{reportTypes[report.reportType] || report.reportType}</p>
                <h2>{report.title}{report.groupName ? ` — ${report.groupName}` : ''}</h2>
                <span className={`report-submission-badge ${selectedReport?.hasSubmission ? 'is-submitted' : 'is-missing'}`}>
                  {selectedReport?.hasSubmission ? 'Đã nộp' : 'Chưa nộp'}
                </span>
                <p className="muted">{report.description}</p>
                <p>
                  <strong>Hạn nộp:</strong> {formatDate(report.deadline)}
                  {report.status === 'open' && report.deadline
                    ? ` · ${describeDeadline(report.deadline)}`
                    : ''}
                </p>
                <p><strong>Trạng thái:</strong> {report.status === 'open' ? 'Đang mở' : report.status === 'graded' ? 'Đã chấm' : 'Đã đóng'}</p>
                {canManageReports && (
                  <button className="report-action report-action-secondary" type="button" onClick={() => openReportForm(report)}>
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
                    </svg>
                    Chỉnh sửa đợt báo cáo
                  </button>
                )}
                {report.status === 'open' && isStudentRole(role) && (
                  <form className="data-form" onSubmit={handleSubmit}>
                    <h3>Nộp phiên bản</h3>
                    <div className="report-upload" onDragOver={(event) => event.preventDefault()} onDrop={handleFileDrop}>
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 16V4m-4 4 4-4 4 4M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
                      </svg>
                      <input id="report-file" className="report-file-input" accept=".pdf,.doc,.docx"
                        onChange={(event) => chooseFile(event.target.files?.[0] || null)}
                        ref={fileInputRef} type="file" />
                      <p>Kéo thả tệp vào đây hoặc <label className="report-file-label" htmlFor="report-file">Chọn tệp</label></p>
                      <span className="muted">{file ? file.name : FILE_RULE_TEXT}</span>
                    </div>
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
                        <div>
                          <button className="report-action report-action-secondary" type="button"
                            disabled={downloadingVersionId !== null} onClick={() => handleDownload(version)}>
                            {downloadingVersionId === version.id ? 'Đang tải...' : 'Tải báo cáo'}
                          </button>
                          {downloadError?.versionId === version.id && (
                            <p className="alert-error" role="alert">{downloadError.message}</p>
                          )}
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
          </section>}
        </div>
      )}
    </section>
  )
}

export default ReportsPage
