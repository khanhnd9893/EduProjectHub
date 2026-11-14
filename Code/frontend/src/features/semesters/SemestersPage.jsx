import { useEffect, useState } from 'react'
import PageHeading from '../../components/PageHeading.jsx'
import semesterApi from '../../api/semesterApi.js'
import './semesters.css'
import { useAuth } from '../../contexts/useAuth.js'
import { isAcademicManagerRole } from '../../utils/roles.js'

const semesterStatusLabels = {
  draft: 'Bản nháp',
  open: 'Đang mở',
  in_progress: 'Đang diễn ra',
  closed: 'Đã đóng',
}
const allStatus = 'all'

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
  const { role } = useAuth()
  const canManageSemesters = isAcademicManagerRole(role)
  const [semesters, setSemesters] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSemester, setEditingSemester] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isStatusSaving, setIsStatusSaving] = useState(false)
  const [statusTarget, setStatusTarget] = useState(null)
  const [statusFilter, setStatusFilter] = useState(allStatus)
  const [success, setSuccess] = useState('')

  const emptyForm = {
    roundCode: '',
    roundName: '',
    semester: 'Học kỳ 1',
    academicYear: '',
    startDate: '',
    endDate: '',
    minMembers: 2,
    maxMembers: 5,
    status: 'draft',
  }
  const [form, setForm] = useState(emptyForm)

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

  function openCreateForm() {
    setEditingSemester(null)
    setForm(emptyForm)
    setError('')
    setSuccess('')
    setIsFormOpen(true)
  }

  function openEditForm(semester) {
    setEditingSemester(semester)
    setForm({ ...semester })
    setError('')
    setSuccess('')
    setIsFormOpen(true)
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: ['minMembers', 'maxMembers'].includes(name) ? Number(value) : value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!form.roundCode.trim() || !form.roundName.trim()) {
      setError('Vui lòng nhập mã đợt và tên đợt.')
      return
    }
    if ((form.startDate && !form.endDate) || (!form.startDate && form.endDate)) {
      setError('Vui lòng nhập cả ngày bắt đầu và ngày kết thúc.')
      return
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError('Ngày kết thúc không được trước ngày bắt đầu.')
      return
    }
    if (form.minMembers < 1 || form.maxMembers < form.minMembers) {
      setError('Số thành viên tối đa phải lớn hơn hoặc bằng số tối thiểu.')
      return
    }

    setIsSaving(true)
    try {
      const saved = editingSemester
        ? await semesterApi.updateSemester(editingSemester.id, form)
        : await semesterApi.createSemester(form)
      setSemesters((current) =>
        editingSemester
          ? current.map((semester) => (semester.id === saved.id ? saved : semester))
          : [saved, ...current],
      )
      setIsFormOpen(false)
      setSuccess(editingSemester ? 'Đã cập nhật học kỳ.' : 'Đã tạo học kỳ.')
    } catch (saveError) {
      setError(saveError.message || 'Không thể lưu học kỳ.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleStatusChange() {
    if (!statusTarget) {
      return
    }

    setError('')
    setSuccess('')
    setIsStatusSaving(true)
    const nextStatus = statusTarget.status === 'closed' ? 'open' : 'closed'
    try {
      const saved = await semesterApi.updateSemester(statusTarget.id, {
        ...statusTarget,
        status: nextStatus,
      })
      setSemesters((current) =>
        current.map((semester) => (semester.id === saved.id ? saved : semester)),
      )
      setSuccess(
        nextStatus === 'closed'
          ? 'Đã đóng học kỳ.'
          : 'Đã mở học kỳ.',
      )
      setStatusTarget(null)
    } catch (saveError) {
      setError(saveError.message || 'Không thể cập nhật trạng thái học kỳ.')
    } finally {
      setIsStatusSaving(false)
    }
  }

  const visibleSemesters = semesters.filter(
    (semester) => statusFilter === allStatus || semester.status === statusFilter,
  )

  return (
    <section className="dashboard-page">
      <PageHeading
        eyebrow="Quản trị"
        title="Quản lý đợt đồ án"
        description="Xem các đợt đồ án hiện có."
        status={isLoading ? 'Đang tải' : canManageSemesters ? 'Có quyền quản lý' : 'Chỉ xem'}
      />
      {canManageSemesters && (
        <button className="semester-create-button" type="button" onClick={openCreateForm}>
          Thêm học kỳ
        </button>
      )}
      {error && <p className="alert-error" role="alert">{error}</p>}
      {success && <p className="success-message" role="status">{success}</p>}
      <label className="semester-filter field-control">
        Lọc theo trạng thái
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value={allStatus}>Tất cả trạng thái</option>
          {Object.entries(semesterStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      {isFormOpen && canManageSemesters && (
        <form className="workspace-panel data-form semester-form" onSubmit={handleSubmit}>
          <div className="semester-form-heading">
            <h2>{editingSemester ? 'Chỉnh sửa học kỳ' : 'Thêm học kỳ'}</h2>
            <button className="button-secondary" type="button" onClick={() => setIsFormOpen(false)}>
              Hủy
            </button>
          </div>
          <div className="form-grid">
            <label className="field-control">
              Mã đợt
              <input maxLength="30" name="roundCode" required value={form.roundCode} onChange={handleChange} />
            </label>
            <label className="field-control">
              Tên đợt
              <input maxLength="150" name="roundName" required value={form.roundName} onChange={handleChange} />
            </label>
            <label className="field-control">
              Học kỳ
              <select name="semester" value={form.semester} onChange={handleChange}>
                <option>Học kỳ 1</option>
                <option>Học kỳ 2</option>
                <option>Học kỳ hè</option>
              </select>
            </label>
            <label className="field-control">
              Năm học
              <input maxLength="20" name="academicYear" required value={form.academicYear} onChange={handleChange} />
            </label>
            <label className="field-control">
              Ngày bắt đầu
              <input name="startDate" type="date" value={form.startDate} onChange={handleChange} />
            </label>
            <label className="field-control">
              Ngày kết thúc
              <input name="endDate" type="date" value={form.endDate} onChange={handleChange} />
            </label>
            <label className="field-control">
              Số thành viên tối thiểu
              <input name="minMembers" type="number" min="1" max="255" value={form.minMembers} onChange={handleChange} />
            </label>
            <label className="field-control">
              Số thành viên tối đa
              <input name="maxMembers" type="number" min="1" max="255" value={form.maxMembers} onChange={handleChange} />
            </label>
            <label className="field-control">
              Trạng thái
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="draft">Bản nháp</option>
                <option value="open">Đang mở</option>
                <option value="in_progress">Đang diễn ra</option>
                <option value="closed">Đã đóng</option>
              </select>
            </label>
          </div>
          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Đang lưu...' : 'Lưu học kỳ'}
          </button>
        </form>
      )}
      {isLoading ? (
        <p role="status">Đang tải học kỳ...</p>
      ) : visibleSemesters.length ? (
        <div className="semester-grid">
          {visibleSemesters.map((semester) => (
            <article className="workspace-panel semester-card" key={semester.id}>
              <p className="eyebrow">{semester.roundCode}</p>
              <h2>{semester.roundName}</h2>
              <span className="status-chip">
                {semesterStatusLabels[semester.status] || semester.status}
              </span>
              {canManageSemesters && (
                <button className="button-secondary" type="button" onClick={() => openEditForm(semester)}>
                  Chỉnh sửa
                </button>
              )}
              {canManageSemesters && (
                <button
                  className="button-secondary"
                  type="button"
                  disabled={isStatusSaving}
                  onClick={() => setStatusTarget(semester)}
                >
                  {semester.status === 'closed' ? 'Mở học kỳ' : 'Đóng học kỳ'}
                </button>
              )}
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
          {semesters.length
            ? 'Không có học kỳ phù hợp với bộ lọc.'
            : 'Chưa có dữ liệu học kỳ. API PHP quản lý học kỳ chưa được triển khai.'}
        </section>
      )}
      {statusTarget && (
        <div className="semester-modal-backdrop" role="presentation">
          <section
            className="workspace-panel semester-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="semester-status-dialog-title"
          >
            <h2 id="semester-status-dialog-title">
              {statusTarget.status === 'closed' ? 'Mở học kỳ?' : 'Đóng học kỳ?'}
            </h2>
            <p>
              Bạn có chắc muốn {statusTarget.status === 'closed' ? 'mở' : 'đóng'} học kỳ
              <strong> {statusTarget.roundName}</strong> không?
            </p>
            <div className="semester-modal-actions">
              <button
                className="button-secondary"
                type="button"
                disabled={isStatusSaving}
                onClick={() => setStatusTarget(null)}
              >
                Hủy
              </button>
              <button type="button" disabled={isStatusSaving} onClick={handleStatusChange}>
                {isStatusSaving ? 'Đang lưu...' : 'Xác nhận'}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

export default SemestersPage
