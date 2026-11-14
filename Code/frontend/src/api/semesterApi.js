import apiClient from './client.js'
import { unwrap } from './response.js'
import { mockResolve, nextId } from './mock/helpers.js'
import { isMockMode } from '../config/runtime.js'

const useMock = isMockMode
export const semesterStatuses = ['draft', 'open', 'in_progress', 'closed']

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

function mapSemester(semester) {
  return {
    id: Number(semester.id),
    roundCode: semester.round_code ?? semester.roundCode,
    roundName: semester.round_name ?? semester.roundName,
    semester: semester.semester,
    academicYear: semester.academic_year ?? semester.academicYear,
    startDate: semester.start_date ?? semester.startDate,
    endDate: semester.end_date ?? semester.endDate,
    minMembers: Number(semester.min_members ?? semester.minMembers),
    maxMembers: Number(semester.max_members ?? semester.maxMembers),
    status: semester.status,
  }
}

function mapSemesterPayload(values) {
  return {
    round_code: values.roundCode,
    round_name: values.roundName,
    semester: values.semester,
    academic_year: values.academicYear,
    start_date: values.startDate || null,
    end_date: values.endDate || null,
    min_members: Number(values.minMembers),
    max_members: Number(values.maxMembers),
    status: values.status,
  }
}

function validateSemester(values, existingId = null) {
  if (!values.roundCode?.trim() || !values.roundName?.trim()) {
    throw new Error('Mã đợt và tên đợt là bắt buộc.')
  }
  if (values.startDate && values.endDate && values.endDate < values.startDate) {
    throw new Error('Ngày kết thúc không được trước ngày bắt đầu.')
  }
  if (values.minMembers < 1 || values.maxMembers < values.minMembers) {
    throw new Error('Số thành viên phải thỏa mãn tối thiểu >= 1 và tối đa >= tối thiểu.')
  }
  if (!semesterStatuses.includes(values.status)) {
    throw new Error('Trạng thái học kỳ không hợp lệ.')
  }
  const duplicate = mockSemesters.some(
    (semester) =>
      semester.id !== Number(existingId) &&
      semester.roundCode.toLowerCase() === values.roundCode.trim().toLowerCase(),
  )
  if (duplicate) {
    throw new Error('Mã đợt đã tồn tại.')
  }
}

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
    validateSemester(values)
    if (useMock) {
      const semester = { id: nextId(mockSemesters), ...values }
      mockSemesters.unshift(semester)
      return mockResolve(semester)
    } else {
      // TODO: Chờ backend triển khai POST /semesters.php?action=create.
      return mapSemester(
        await unwrap(
          apiClient.post('/semesters.php', mapSemesterPayload(values), {
            params: { action: 'create' },
          }),
        ),
      )
    }
  },

  async updateSemester(id, values) {
    validateSemester(values, id)
    if (useMock) {
      const index = mockSemesters.findIndex((semester) => semester.id === Number(id))
      if (index === -1) {
        throw new Error('Không tìm thấy học kỳ cần cập nhật.')
      }

      mockSemesters[index] = { ...mockSemesters[index], ...values }
      return mockResolve(mockSemesters[index])
    } else {
      // TODO: Chờ backend triển khai PATCH /semesters.php?action=update.
      return mapSemester(
        await unwrap(
          apiClient.patch('/semesters.php', mapSemesterPayload(values), {
            params: { action: 'update', id },
          }),
        ),
      )
    }
  },
}

export default semesterApi
