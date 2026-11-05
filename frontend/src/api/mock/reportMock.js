import { daysFromNow } from './helpers.js'

// Tên trường theo database/schema-reports-defense-chatbot.sql.
// lecturerName, submittedByName, studentName, projectTitle là trường join, không có trong bảng.
export const mockReports = [
  {
    id: 1,
    projectId: 1,
    title: 'Báo cáo tuần 1',
    reportType: 'weekly',
    description: 'Tổng kết phân tích yêu cầu.',
    deadline: daysFromNow(-14),
    status: 'closed',
    createdBy: 2,
    createdAt: daysFromNow(-21),
    updatedAt: daysFromNow(-14),
  },
  {
    id: 2,
    projectId: 1,
    title: 'Báo cáo giữa kỳ',
    reportType: 'midterm',
    description: 'Nộp tiến độ và các màn hình chính đã hoàn thành.',
    deadline: daysFromNow(10),
    status: 'open',
    createdBy: 2,
    createdAt: daysFromNow(-7),
    updatedAt: daysFromNow(-1),
  },
  {
    id: 3,
    projectId: 1,
    title: 'Báo cáo cuối kỳ',
    reportType: 'final',
    description: 'Báo cáo hoàn chỉnh kèm phụ lục minh chứng.',
    deadline: daysFromNow(45),
    status: 'open',
    createdBy: 2,
    createdAt: daysFromNow(-7),
    updatedAt: daysFromNow(-7),
  },
]

export const mockReportVersions = [
  {
    id: 1,
    reportId: 1,
    versionNo: 1,
    submittedBy: 1,
    submittedByName: 'Nguyễn Văn A',
    originalFilename: 'bao-cao-tuan-1.pdf',
    storedFilename: 'report-1-v1.pdf',
    mimeType: 'application/pdf',
    fileSize: 524288,
    note: 'Bản nộp lần đầu.',
    submittedAt: daysFromNow(-15),
  },
  {
    id: 2,
    reportId: 2,
    versionNo: 1,
    submittedBy: 1,
    submittedByName: 'Nguyễn Văn A',
    originalFilename: 'bao-cao-giua-ky-nhap.docx',
    storedFilename: 'report-2-v1.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 1048576,
    note: 'Bản nháp để xin góp ý.',
    submittedAt: daysFromNow(-2),
  },
]

export const mockReportFeedback = [
  {
    id: 1,
    reportVersionId: 1,
    lecturerId: 2,
    lecturerName: 'TS. Trần Thị B',
    content: 'Phần phân tích đủ ý, cần bổ sung sơ đồ luồng cho chức năng nhóm.',
    score: 8.5,
    createdAt: daysFromNow(-13),
  },
  {
    id: 2,
    reportVersionId: 2,
    lecturerId: 2,
    lecturerName: 'TS. Trần Thị B',
    content: 'Bổ sung ảnh màn hình và kết quả kiểm thử trước khi nộp bản chính thức.',
    score: null,
    createdAt: daysFromNow(-1),
  },
]

export const mockFinalGrades = [
  {
    projectId: 1,
    projectTitle: 'Hệ thống quản lý đồ án sinh viên',
    studentId: 1,
    studentName: 'Nguyễn Văn A',
    totalScore: 8.75,
    status: 'published',
    note: 'Hoàn thành tốt phần giao diện.',
    publishedAt: daysFromNow(-1),
    updatedAt: daysFromNow(-1),
  },
  {
    projectId: 1,
    projectTitle: 'Hệ thống quản lý đồ án sinh viên',
    studentId: 11,
    studentName: 'Lê Thị Cúc',
    totalScore: 8.25,
    status: 'published',
    note: null,
    publishedAt: daysFromNow(-1),
    updatedAt: daysFromNow(-1),
  },
  {
    projectId: 1,
    projectTitle: 'Hệ thống quản lý đồ án sinh viên',
    studentId: 12,
    studentName: 'Phạm Minh Đức',
    totalScore: 7.5,
    status: 'draft',
    note: 'Chờ hội đồng xác nhận.',
    publishedAt: null,
    updatedAt: daysFromNow(-1),
  },
]
