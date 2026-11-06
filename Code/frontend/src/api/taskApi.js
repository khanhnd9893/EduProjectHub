import apiClient from './client.js'
import { unwrap } from './response.js'
import {
  findOrThrow,
  getMockUser,
  mockResolve,
  nextId,
  nowIso,
} from './mock/helpers.js'
import { mockTasks } from './mock/taskMock.js'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

const taskFieldNames = {
  groupId: 'group_id',
  completionCriteria: 'completion_criteria',
  assignedTo: 'assigned_to',
  dueAt: 'due_at',
}

function mapTask(task) {
  return {
    id: Number(task.id),
    groupId: Number(task.group_id),
    title: task.title,
    description: task.description,
    completionCriteria: task.completion_criteria,
    assignedTo: task.assigned_to == null ? null : Number(task.assigned_to),
    assigneeName: task.assignee_name,
    createdBy: Number(task.created_by),
    creatorName: task.creator_name,
    priority: task.priority,
    status: task.status,
    dueAt: task.due_at,
    completedAt: task.completed_at,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
  }
}

function formatDueAt(value) {
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(value)) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      throw new Error('dueAt không phải ngày giờ hợp lệ.')
    }

    const pad = (part) => String(part).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  }

  const formatted = value.replace('T', ' ')
  return formatted.length === 16 ? `${formatted}:00` : formatted.slice(0, 19)
}

function toBackendTask(task) {
  return Object.fromEntries(
    Object.entries(task).map(([key, value]) => [
      taskFieldNames[key] || key,
      key === 'dueAt' && typeof value === 'string'
        ? formatDueAt(value)
        : value,
    ]),
  )
}

const taskApi = {
  async listTasks({ groupId, status } = {}) {
    if (useMock) {
      return mockResolve(
        mockTasks.filter(
          (task) =>
            (groupId === undefined || task.groupId === Number(groupId)) &&
            (status === undefined || task.status === status),
        ),
      )
    }

    if (groupId === undefined) {
      throw new Error('groupId là bắt buộc khi lấy nhiệm vụ từ backend PHP.')
    }

    const tasks = await unwrap(
      apiClient.get('/tasks.php', {
        params: { action: 'tasks', group_id: groupId, status },
      }),
    )
    return tasks.map(mapTask)
  },

  async getTask(taskId) {
    if (useMock) {
      return mockResolve(
        findOrThrow(mockTasks, taskId, 'Không tìm thấy nhiệm vụ'),
      )
    }

    return mapTask(
      await unwrap(
        apiClient.get('/tasks.php', {
          params: { action: 'task', id: taskId },
        }),
      ),
    )
  },

  async createTask(task) {
    if (task.groupId === undefined) {
      throw new Error('groupId là bắt buộc khi tạo nhiệm vụ.')
    }

    if (useMock) {
      const created = {
        completionCriteria: null,
        dueAt: null,
        assignedTo: null,
        assigneeName: null,
        priority: 'normal',
        ...task,
        id: nextId(mockTasks),
        status: 'todo',
        createdBy: getMockUser().id,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      mockTasks.push(created)
      return mockResolve(created)
    }

    return unwrap(
      apiClient.post('/tasks.php?action=create', toBackendTask(task)),
    )
  },

  async updateTask(taskId, changes) {
    if (useMock) {
      const task = findOrThrow(mockTasks, taskId, 'Không tìm thấy nhiệm vụ')
      Object.assign(task, changes, { updatedAt: nowIso() })
      return mockResolve(task)
    }

    return unwrap(
      apiClient.patch('/tasks.php?action=update', {
        ...toBackendTask(changes),
        id: taskId,
      }),
    )
  },

  async updateTaskStatus(taskId, status) {
    if (useMock) {
      const task = findOrThrow(mockTasks, taskId, 'Không tìm thấy nhiệm vụ')
      task.status = status
      task.updatedAt = nowIso()
      return mockResolve(task)
    }

    return unwrap(
      apiClient.patch('/tasks.php?action=status', { id: taskId, status }),
    )
  },

  async deleteTask(taskId) {
    if (useMock) {
      const taskIndex = mockTasks.findIndex(
        (task) => task.id === Number(taskId),
      )
      if (taskIndex === -1) {
        throw new Error('Không tìm thấy nhiệm vụ')
      }

      mockTasks.splice(taskIndex, 1)
      return mockResolve({ id: Number(taskId) })
    }

    return unwrap(
      apiClient.delete('/tasks.php?action=delete', {
        data: { id: taskId },
      }),
    )
  },
}

export default taskApi
