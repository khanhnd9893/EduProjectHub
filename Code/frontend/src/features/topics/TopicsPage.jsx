import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeading from '../../components/PageHeading.jsx'
import semesterApi from '../../api/semesterApi.js'
import teamApi from '../../api/teamApi.js'
import topicApi from '../../api/topicApi.js'
import { useAuth } from '../../contexts/useAuth.js'
import { isStudentRole, topicManagerRoles } from '../../utils/roles.js'

const topicStatuses = {
  draft: 'Bản nháp',
  open: 'Đang nhận đăng ký',
  closed: 'Đã đóng',
}

const registrationStatuses = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  cancelled: 'Đã hủy',
}

const emptyForm = {
  projectRoundId: '',
  topicCode: '',
  title: '',
  description: '',
  supervisorUserId: '',
  maxGroups: 1,
  status: 'draft',
}

function TopicsPage() {
  const { role, user } = useAuth()
  const [topics, setTopics] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [teams, setTeams] = useState([])
  const [semesters, setSemesters] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const fetchData = useCallback(
    () => Promise.all([
      topicApi.listTopics(),
      teamApi.listTeams(),
      topicManagerRoles.includes(role) ? semesterApi.listSemesters() : Promise.resolve([]),
      topicApi.listRegistrations(),
    ]),
    [role],
  )

  const applyData = useCallback(([topicList, teamList, semesterList, registrationList]) => {
    setTopics(topicList)
    setTeams(teamList)
    setSemesters(semesterList)
    setRegistrations(registrationList)
  }, [])

  const loadData = useCallback(async () => {
    applyData(await fetchData())
  }, [applyData, fetchData])

  useEffect(() => {
    let active = true
    fetchData()
      .then((data) => {
        if (active) {
          applyData(data)
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || 'Không thể tải đề tài.')
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
  }, [applyData, fetchData])

  const myGroups = useMemo(
    () => teams.filter((team) => team.leaderUserId === user?.id),
    [teams, user?.id],
  )

  async function handleCreate(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setIsSaving(true)
    try {
      await topicApi.createTopic({
        project_round_id: Number(form.projectRoundId || semesters[0]?.id),
        topic_code: form.topicCode,
        title: form.title,
        description: form.description || null,
        supervisor_user_id: form.supervisorUserId || null,
        max_groups: Number(form.maxGroups),
        status: form.status,
      })
      setForm((current) => ({
        ...emptyForm,
        projectRoundId: current.projectRoundId || String(semesters[0]?.id ?? ''),
      }))
      await loadData()
      setNotice('Đã tạo đề tài.')
    } catch (saveError) {
      setError(saveError.message || 'Không thể tạo đề tài.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleStatusChange(topic, status) {
    setError('')
    try {
      await topicApi.updateTopic(topic.id, { status })
      await loadData()
    } catch (updateError) {
      setError(updateError.message || 'Không thể cập nhật trạng thái đề tài.')
    }
  }

  async function handleRegister(topic, groupId) {
    setError('')
    setNotice('')
    try {
      await topicApi.register(groupId, topic.id)
      await loadData()
      setNotice('Đã gửi đăng ký đề tài, đang chờ duyệt.')
    } catch (registerError) {
      setError(registerError.message || 'Không thể đăng ký đề tài.')
    }
  }

  async function handleReview(registration, status) {
    setError('')
    try {
      await topicApi.review(registration.id, status)
      await loadData()
      setNotice('Đã cập nhật đăng ký đề tài.')
    } catch (reviewError) {
      setError(reviewError.message || 'Không thể xử lý đăng ký.')
    }
  }

  const canReview = topicManagerRoles.includes(role)

  return (
    <section className="dashboard-page">
      <PageHeading
        eyebrow="Đồ án"
        title="Đề tài đồ án"
        description="Quản lý danh sách đề tài và theo dõi đăng ký của các nhóm."
        status={isLoading ? 'Đang tải' : `${topics.length} đề tài`}
      />
      {error && <p className="alert-error" role="alert">{error}</p>}
      {notice && <p className="success-message" role="status">{notice}</p>}

      {topicManagerRoles.includes(role) && (
        <form className="workspace-panel data-form topic-form" onSubmit={handleCreate}>
          <h2>Tạo đề tài</h2>
          <div className="form-grid">
            <label className="field-control">
              Đợt đồ án
              <select
                onChange={(event) => setForm((current) => ({ ...current, projectRoundId: event.target.value }))}
                required
                value={form.projectRoundId || String(semesters[0]?.id ?? '')}
              >
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>{semester.roundName}</option>
                ))}
              </select>
            </label>
            <label className="field-control">
              Mã đề tài
              <input onChange={(event) => setForm((current) => ({ ...current, topicCode: event.target.value }))} required value={form.topicCode} />
            </label>
            <label className="field-control">
              Tên đề tài
              <input onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required value={form.title} />
            </label>
            <label className="field-control">
              Số nhóm tối đa
              <input min="1" onChange={(event) => setForm((current) => ({ ...current, maxGroups: Number(event.target.value) }))} required type="number" value={form.maxGroups} />
            </label>
            <label className="field-control">
              Trạng thái
              <select onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} value={form.status}>
                <option value="draft">Bản nháp</option>
                <option value="open">Đang nhận đăng ký</option>
                <option value="closed">Đã đóng</option>
              </select>
            </label>
          </div>
          <label className="field-control">
            Mô tả
            <textarea onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows="3" value={form.description} />
          </label>
          <button disabled={isSaving || semesters.length === 0} type="submit">
            {isSaving ? 'Đang lưu...' : 'Thêm đề tài'}
          </button>
        </form>
      )}

      {isLoading ? (
        <p role="status">Đang tải đề tài...</p>
      ) : topics.length === 0 ? (
        <section className="workspace-panel teams-message">Chưa có đề tài phù hợp.</section>
      ) : (
        <div className="topic-grid">
          {topics.map((topic) => {
            return (
              <article className="workspace-panel topic-card" key={topic.id}>
                <p className="eyebrow">{topic.topicCode}</p>
                <h2>{topic.title}</h2>
                <p className="muted">{topic.description || 'Chưa có mô tả.'}</p>
                <p className="muted">
                  Hướng dẫn: {topic.supervisorName || 'Chưa phân công'}
                </p>
                <p className="muted">
                  Nhóm đã duyệt: {topic.approvedGroups}/{topic.maxGroups}
                </p>
                <span className="status-chip">{topicStatuses[topic.status] || topic.status}</span>
                {topicManagerRoles.includes(role) && (
                  <label className="field-control topic-status-control">
                    Trạng thái
                    <select onChange={(event) => handleStatusChange(topic, event.target.value)} value={topic.status}>
                      <option value="draft">Bản nháp</option>
                      <option value="open">Đang nhận đăng ký</option>
                      <option value="closed">Đã đóng</option>
                    </select>
                  </label>
                )}
                {isStudentRole(role) && myGroups.length > 0 && topic.status === 'open' && (
                  <div className="topic-register-actions">
                    {myGroups.map((group) => (
                      (() => {
                        const existingRegistration = registrations.find(
                          (registration) =>
                            registration.groupId === group.id &&
                            ['pending', 'approved'].includes(registration.status),
                        )
                        return (
                          <button
                            className="button-secondary"
                            disabled={Boolean(existingRegistration)}
                            key={group.id}
                            onClick={() => handleRegister(topic, group.id)}
                            type="button"
                          >
                            {existingRegistration
                              ? `${group.groupName}: ${registrationStatuses[existingRegistration.status]}`
                              : `Đăng ký cho ${group.groupName}`}
                          </button>
                        )
                      })()
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {canReview && (
        <section className="workspace-panel topic-registrations">
          <h2>Đăng ký đề tài</h2>
          {registrations.length === 0 ? (
            <p className="muted">Chưa có đăng ký cần hiển thị.</p>
          ) : (
            <ul className="notification-list">
              {registrations.map((registration) => (
                <li key={registration.id}>
                  <div>
                    <strong>{registration.topicTitle}</strong>
                    <p className="muted">{registration.groupName} · {registration.registeredByName}</p>
                    <span className="status-chip">{registrationStatuses[registration.status]}</span>
                  </div>
                  {registration.status === 'pending' && (
                    <div className="topic-review-actions">
                      <button onClick={() => handleReview(registration, 'approved')} type="button">Duyệt</button>
                      <button className="button-secondary" onClick={() => handleReview(registration, 'rejected')} type="button">Từ chối</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </section>
  )
}

export default TopicsPage
