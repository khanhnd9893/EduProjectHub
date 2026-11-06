export const TASK_STATUS_LABELS = {
  todo: 'Chưa làm',
  in_progress: 'Đang làm',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

export function getTaskStatusLabel(status) {
  return TASK_STATUS_LABELS[status] || status
}

// "Quá hạn" is derived from the due date and is not stored as a task status.
export function isTaskOverdue(task, now = new Date()) {
  if (!task.dueAt || ['completed', 'cancelled'].includes(task.status)) {
    return false
  }

  return new Date(task.dueAt) < now
}
