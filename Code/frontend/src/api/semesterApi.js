import apiClient from './client.js'
import { unwrap } from './response.js'
import { mockResolve, nextId } from './mock/helpers.js'
import { isMockMode } from '../config/runtime.js'

const useMock = isMockMode

function mapSemester(semester) {
  return {
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
  }
}

function toBackendSemester(values) {
  return {
    round_code: values.roundCode,
    round_name: values.roundName,
    semester: values.semester || null,
    academic_year: values.academicYear || null,
    start_date: values.startDate || null,
    end_date: values.endDate || null,
    min_members: Number(values.minMembers),
    max_members: Number(values.maxMembers),
    status: values.status,
  }
}

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
    return semesters.map(mapSemester)
  },

  async createSemester(values) {
    if (useMock) {
      const semester = { id: nextId(mockSemesters), ...values }
      mockSemesters.unshift(semester)
      return mockResolve(semester)
    }

    return mapSemester(
      await unwrap(
        apiClient.post('/semesters.php?action=create', toBackendSemester(values)),
      ),
    )
  },

  async updateSemester(id, values) {
    if (useMock) {
      const index = mockSemesters.findIndex((semester) => semester.id === Number(id))
      if (index === -1) {
        throw new Error('Không tìm thấy học kỳ cần cập nhật.')
      }

      mockSemesters[index] = { ...mockSemesters[index], ...values }
      return mockResolve(mockSemesters[index])
    }

    return mapSemester(
      await unwrap(
        apiClient.patch('/semesters.php?action=update', {
          id: Number(id),
          ...toBackendSemester(values),
        }),
      ),
    )
  },
}

export default semesterApi
