export const TASK_STATUS_LABELS = {
  todo: 'Chưa làm',
  in_progress: 'Đang làm',
  submitted: 'Đã nộp',
  needs_revision: 'Cần chỉnh sửa',
  approved: 'Đã duyệt',
}

export function getTaskStatusLabel(status) {
  return TASK_STATUS_LABELS[status] || status
}

// "Quá hạn" không phải trạng thái lưu: đã qua deadline mà nhiệm vụ chưa được nộp hoặc duyệt.
export function isTaskOverdue(task, now = new Date()) {
  if (!task.deadline || ['submitted', 'approved'].includes(task.status)) {
    return false
  }

  return new Date(task.deadline) < now
}
