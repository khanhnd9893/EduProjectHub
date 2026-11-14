export const studentRoles = ['STUDENT', 'TEAM_LEADER']
export const academicManagerRoles = ['TRAINING_MANAGER']
export const systemDataViewerRoles = ['ADMIN', ...academicManagerRoles]
export const topicManagerRoles = [...academicManagerRoles, 'LECTURER']
export const reportManagerRoles = academicManagerRoles

const allRoles = [
  'ADMIN',
  'STUDENT',
  'TEAM_LEADER',
  'LECTURER',
  'TRAINING_MANAGER',
]

const pageRoles = {
  accounts: ['ADMIN'],
  topics: allRoles,
  semesters: systemDataViewerRoles,
  'project-work': allRoles,
  chatbot: allRoles,
}

export function canAccessPage(role, page) {
  return pageRoles[page]?.includes(role) ?? false
}

export function isStudentRole(role) {
  return studentRoles.includes(role)
}

export function isAcademicManagerRole(role) {
  return academicManagerRoles.includes(role)
}

export function canViewAllData(role) {
  return systemDataViewerRoles.includes(role)
}

export function roleLabel(role) {
  return {
    ADMIN: 'Quản trị viên',
    STUDENT: 'Sinh viên',
    TEAM_LEADER: 'Trưởng nhóm',
    LECTURER: 'Giảng viên',
    TRAINING_MANAGER: 'Người đào tạo',
  }[role] || role
}
