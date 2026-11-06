import { backendNotImplemented } from './response.js'
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

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

const reportApi = {
  async listReports({ projectId } = {}) {
    if (useMock) {
      return mockResolve(
        mockReports.filter(
          (report) =>
            projectId === undefined || report.projectId === Number(projectId),
        ),
      )
    }

    return backendNotImplemented('báo cáo')
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

    return backendNotImplemented('chi tiết báo cáo')
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

    return backendNotImplemented('nộp phiên bản báo cáo')
  },

  async listGrades({ projectId } = {}) {
    if (useMock) {
      const user = getMockUser()
      return mockResolve(
        mockFinalGrades.filter(
          (grade) =>
            (projectId === undefined || grade.projectId === Number(projectId)) &&
            (user.role !== 'STUDENT' ||
              (grade.studentId === user.id && grade.status === 'published')),
        ),
      )
    }

    return backendNotImplemented('điểm')
  },
}

export default reportApi
