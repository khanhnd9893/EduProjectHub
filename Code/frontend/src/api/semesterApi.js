import apiClient from './client.js'
import { unwrap } from './response.js'
import { mockResolve } from './mock/helpers.js'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

const mockSemesters = [
  {
    id: 1,
    roundCode: 'DA_HK1_2026',
    roundName: 'Đồ án học kỳ 1 năm 2026',
    semester: 'Học kỳ 1',
    academicYear: '2026-2027',
    startDate: '2026-09-01',
    endDate: '2027-01-31',
    minMembers: 2,
    maxMembers: 5,
    status: 'open',
  },
]

const semesterApi = {
  async listSemesters() {
    if (useMock) {
      return mockResolve(mockSemesters)
    }

    const semesters = await unwrap(
      apiClient.get('/semesters.php', { params: { action: 'semesters' } }),
    )
    return semesters.map((semester) => ({
      id: Number(semester.id),
      roundCode: semester.round_code,
      roundName: semester.round_name,
      semester: semester.semester,
      academicYear: semester.academic_year,
      startDate: semester.start_date,
      endDate: semester.end_date,
      minMembers: Number(semester.min_members),
      maxMembers: Number(semester.max_members),
      status: semester.status,
    }))
  },
}

export default semesterApi
