import { useEffect, useState } from 'react'
import PageHeading from '../../components/PageHeading.jsx'
import semesterApi from '../../api/semesterApi.js'
import './semesters.css'

const semesterStatusLabels = {
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
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSemester, setEditingSemester] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
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

  return (
    <section className="dashboard-page">
      <PageHeading
        eyebrow="Quản trị"
        title="Quản lý học kỳ"
        description="Danh sách học kỳ/đợt đồ án hiện có."
        status={isLoading ? 'Đang tải' : 'Chỉ ADMIN'}
      />
      <button className="semester-create-button" type="button" onClick={openCreateForm}>
        Thêm học kỳ
      </button>
      {error && <p className="alert-error" role="alert">{error}</p>}
      {success && <p className="success-message" role="status">{success}</p>}
      {isFormOpen && (
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
              <input name="roundCode" value={form.roundCode} onChange={handleChange} />
            </label>
            <label className="field-control">
              Tên đợt
              <input name="roundName" value={form.roundName} onChange={handleChange} />
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
              <input name="academicYear" value={form.academicYear} onChange={handleChange} />
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
              <input name="minMembers" type="number" min="1" value={form.minMembers} onChange={handleChange} />
            </label>
            <label className="field-control">
              Số thành viên tối đa
              <input name="maxMembers" type="number" min="1" value={form.maxMembers} onChange={handleChange} />
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
      ) : semesters.length ? (
        <div className="semester-grid">
          {semesters.map((semester) => (
            <article className="workspace-panel semester-card" key={semester.id}>
              <p className="eyebrow">{semester.roundCode}</p>
              <h2>{semester.roundName}</h2>
              <span className="status-chip">
                {semesterStatusLabels[semester.status] || semester.status}
              </span>
              <button className="button-secondary" type="button" onClick={() => openEditForm(semester)}>
                Chỉnh sửa
              </button>
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
