import apiClient from './client.js'
import { unwrap } from './response.js'
import {
  findOrThrow,
  getMockUser,
  mockResolve,
  nextId,
  nowIso,
} from './mock/helpers.js'
import {
  mockFinalGrades,
  mockReportFeedback,
  mockReports,
  mockReportVersions,
} from './mock/reportMock.js'
import { isStudentRole } from '../utils/roles.js'
import { isMockMode } from '../config/runtime.js'

const useMock = isMockMode

function mapFeedback(feedback) {
  return {
    id: Number(feedback.id),
    reportVersionId: Number(feedback.report_version_id),
    lecturerId: Number(feedback.lecturer_user_id),
    lecturerName: feedback.lecturer_name,
    content: feedback.content,
    score: feedback.score === null ? null : Number(feedback.score),
    createdAt: feedback.created_at,
  }
}

function mapVersion(version) {
  return {
    id: Number(version.id),
    reportId: Number(version.report_id),
    versionNo: Number(version.version_no),
    submittedBy: Number(version.submitted_by),
    submittedByName: version.submitted_by_name,
    originalFilename: version.original_filename,
    storedFilename: version.stored_filename,
    mimeType: version.mime_type,
    fileSize: Number(version.file_size),
    note: version.note,
    submittedAt: version.submitted_at,
    feedback: version.feedback?.map(mapFeedback),
  }
}

function mapReport(report) {
  return {
    id: Number(report.id),
    groupId: Number(report.group_id),
    groupName: report.group_name,
    title: report.title,
    reportType: report.report_type,
    description: report.description,
    deadline: report.deadline,
    status: report.status,
    createdBy: Number(report.created_by),
    createdAt: report.created_at,
    updatedAt: report.updated_at,
    versions: report.versions?.map(mapVersion),
  }
}

function mapGrade(grade) {
  return {
    groupId: Number(grade.group_id),
    groupName: grade.group_name,
    studentId: Number(grade.student_id),
    studentName: grade.student_name,
    totalScore: Number(grade.total_score),
    status: grade.status,
    note: grade.note,
    publishedAt: grade.published_at,
    updatedAt: grade.updated_at,
  }
}

const reportApi = {
  async listReports({ groupId } = {}) {
    if (useMock) {
      return mockResolve(
        mockReports.filter(
          (report) =>
            groupId === undefined || report.groupId === Number(groupId),
        ),
      )
    }

    return (
      await unwrap(
        apiClient.get('/reports.php', {
          params: { action: 'reports', group_id: groupId },
        }),
      )
    ).map(mapReport)
  },

  async getReport(reportId) {
    if (useMock) {
      const report = findOrThrow(
        mockReports,
        reportId,
        'Không tìm thấy đợt báo cáo',
      )
      const versions = mockReportVersions
        .filter((version) => version.reportId === report.id)
        .map((version) => ({
          ...version,
          feedback: mockReportFeedback.filter(
            (entry) => entry.reportVersionId === version.id,
          ),
        }))
      return mockResolve({ ...report, versions })
    }

    return mapReport(
      await unwrap(
        apiClient.get('/reports.php', {
          params: { action: 'report', id: reportId },
        }),
      ),
    )
  },

  async submitVersion(reportId, { file, note }) {
    if (useMock) {
      const report = findOrThrow(
        mockReports,
        reportId,
        'Không tìm thấy đợt báo cáo',
      )

      if (report.status !== 'open') {
        throw new Error('Đợt báo cáo đã đóng')
      }

      const user = getMockUser()
      const versionNo =
        mockReportVersions.filter((version) => version.reportId === report.id)
          .length + 1
      const version = {
        id: nextId(mockReportVersions),
        reportId: report.id,
        versionNo,
        submittedBy: user.id,
        submittedByName: user.fullName,
        originalFilename: file.name,
        storedFilename: `report-${report.id}-v${versionNo}`,
        mimeType: file.type,
        fileSize: file.size,
        note,
        submittedAt: nowIso(),
      }
      mockReportVersions.push(version)
      return mockResolve(version)
    }

    const formData = new FormData()
    formData.append('report_id', String(reportId))
    formData.append('file', file)
    if (note) {
      formData.append('note', note)
    }

    const version = await unwrap(
      apiClient.post('/reports.php?action=submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    )
    return {
      id: Number(version.id),
      reportId: Number(version.report_id),
      versionNo: Number(version.version_no),
    }
  },

  async addFeedback(reportVersionId, { content, score }) {
    if (useMock) {
      const user = getMockUser()
      if (user.role !== 'LECTURER') {
        throw new Error('Chỉ giảng viên mới được nhận xét báo cáo.')
      }
      const feedback = {
        id: nextId(mockReportFeedback),
        reportVersionId: Number(reportVersionId),
        lecturerId: user.id,
        lecturerName: user.fullName,
        content,
        score: score === '' ? null : Number(score),
        createdAt: nowIso(),
      }
      mockReportFeedback.push(feedback)
      return mockResolve(feedback)
    }

    return unwrap(
      apiClient.post('/reports.php?action=feedback', {
        report_version_id: reportVersionId,
        content,
        score: score === '' ? null : Number(score),
      }),
    )
  },

  async listGrades({ groupId } = {}) {
    if (useMock) {
      const user = getMockUser()
      return mockResolve(
        mockFinalGrades.filter(
          (grade) =>
            (groupId === undefined || grade.groupId === Number(groupId)) &&
            (!isStudentRole(user.role) ||
              (grade.studentId === user.id && grade.status === 'published')),
        ),
      )
    }

    return (
      await unwrap(
        apiClient.get('/reports.php', {
          params: { action: 'grades', group_id: groupId },
        }),
      )
    ).map(mapGrade)
  },
}

export default reportApi
