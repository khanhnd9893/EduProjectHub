import { daysFromNow } from './helpers.js'

// Tên trường theo database/m5. fullName, studentCode, groupName là trường join, không có trong bảng.
export const mockTeams = [
  {
    id: 1,
    groupCode: 'N01',
    groupName: 'Nhóm EduProjectHub',
    description: 'Xây dựng hệ thống quản lý đồ án sinh viên kết hợp chatbot.',
    projectRoundId: 1,
    leaderUserId: 1,
    createdBy: 1,
    status: 'active',
    createdAt: daysFromNow(-30),
    updatedAt: daysFromNow(-5),
    dissolvedAt: null,
  },
  {
    id: 2,
    groupCode: 'N02',
    groupName: 'Nhóm Thư viện số',
    description: 'Ứng dụng tra cứu tài liệu cho Trung tâm Thông tin – Thư viện.',
    projectRoundId: 1,
    leaderUserId: 14,
    createdBy: 14,
    status: 'forming',
    createdAt: daysFromNow(-12),
    updatedAt: daysFromNow(-2),
    dissolvedAt: null,
  },
]

export const mockMembers = [
  {
    id: 1,
    groupId: 1,
    userId: 1,
    fullName: 'Nguyễn Văn A',
    studentCode: 'SV001',
    memberRole: 'leader',
    status: 'active',
    joinedAt: daysFromNow(-30),
    leftAt: null,
    note: null,
  },
  {
    id: 2,
    groupId: 1,
    userId: 11,
    fullName: 'Lê Thị Cúc',
    studentCode: 'SV011',
    memberRole: 'member',
    status: 'active',
    joinedAt: daysFromNow(-29),
    leftAt: null,
    note: null,
  },
  {
    id: 3,
    groupId: 1,
    userId: 12,
    fullName: 'Phạm Minh Đức',
    studentCode: 'SV012',
    memberRole: 'member',
    status: 'active',
    joinedAt: daysFromNow(-28),
    leftAt: null,
    note: null,
  },
  {
    id: 4,
    groupId: 2,
    userId: 14,
    fullName: 'Võ Thanh Hà',
    studentCode: 'SV014',
    memberRole: 'leader',
    status: 'active',
    joinedAt: daysFromNow(-12),
    leftAt: null,
    note: null,
  },
]

export const mockRequests = [
  {
    id: 1,
    groupId: 1,
    userId: 13,
    fullName: 'Hoàng Gia Bảo',
    message: 'Mình muốn tham gia phần kiểm thử của nhóm.',
    status: 'pending',
    requestedAt: daysFromNow(-1),
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
  },
]

export const mockInvitations = [
  {
    id: 1,
    groupId: 2,
    groupName: 'Nhóm Thư viện số',
    invitedUserId: 1,
    invitedBy: 14,
    message: 'Mời bạn tham gia nhóm Thư viện số.',
    status: 'pending',
    sentAt: daysFromNow(-2),
    respondedAt: null,
    expiresAt: daysFromNow(5),
  },
]
