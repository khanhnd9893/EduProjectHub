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

// Endpoint thật: đề xuất, chờ M5 xác nhận.

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

const taskApi = {
  async listTasks({ projectId, assignedTo } = {}) {
    if (useMock) {
      return mockResolve(
        mockTasks.filter(
          (task) =>
            (projectId === undefined || task.projectId === Number(projectId)) &&
            (assignedTo === undefined || task.assignedTo === Number(assignedTo)),
        ),
      )
    }

    return unwrap(apiClient.get('/tasks', { params: { projectId, assignedTo } }))
  },

  async getTask(taskId) {
    if (useMock) {
      return mockResolve(
        findOrThrow(mockTasks, taskId, 'Không tìm thấy nhiệm vụ'),
      )
    }

    return unwrap(apiClient.get(`/tasks/${taskId}`))
  },

  async createTask(task) {
    if (useMock) {
      const created = {
        startDate: null,
        deadline: null,
        assignedTo: null,
        assigneeName: null,
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

    return unwrap(apiClient.post('/tasks', task))
  },

  async updateTask(taskId, changes) {
    if (useMock) {
      const task = findOrThrow(mockTasks, taskId, 'Không tìm thấy nhiệm vụ')
      Object.assign(task, changes, { updatedAt: nowIso() })
      return mockResolve(task)
    }

    return unwrap(apiClient.put(`/tasks/${taskId}`, changes))
  },

  async updateTaskStatus(taskId, status) {
    if (useMock) {
      const task = findOrThrow(mockTasks, taskId, 'Không tìm thấy nhiệm vụ')
      task.status = status
      task.updatedAt = nowIso()
      return mockResolve(task)
    }

    return unwrap(apiClient.patch(`/tasks/${taskId}/status`, { status }))
  },
}

export default taskApi
