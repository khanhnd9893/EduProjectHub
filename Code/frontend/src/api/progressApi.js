import apiClient from './client.js'
import { unwrap } from './response.js'
import { mockResolve } from './mock/helpers.js'
import { mockMembers } from './mock/teamMock.js'
import { mockTasks } from './mock/taskMock.js'
import teamApi from './teamApi.js'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

function isOverdue(task) {
  return (
    task.dueAt &&
    new Date(task.dueAt) < new Date() &&
    ['todo', 'in_progress'].includes(task.status)
  )
}

function countStatus(tasks, status) {
  return tasks.filter((task) => task.status === status).length
}

function mapProgress(data) {
  const progress = data.progress
  return {
    group: {
      id: Number(data.group.id),
      groupCode: data.group.group_code,
      groupName: data.group.group_name,
      status: data.group.status,
    },
    summary: {
      totalTasks: Number(progress.total_tasks),
      todoTasks: Number(progress.todo_tasks),
      inProgressTasks: Number(progress.in_progress_tasks),
      completedTasks: Number(progress.completed_tasks),
      cancelledTasks: Number(progress.cancelled_tasks),
      overdueTasks: Number(progress.overdue_tasks),
      unassignedTasks: Number(progress.unassigned_tasks),
      completionPercentage: Number(progress.completion_percentage),
      lastUpdatedAt: progress.last_updated_at,
    },
    members: data.members.map((member) => ({
      userId: Number(member.user_id),
      fullName: member.full_name,
      assignedTasks: Number(member.assigned_tasks),
      todoTasks: Number(member.todo_tasks),
      inProgressTasks: Number(member.in_progress_tasks),
      completedTasks: Number(member.completed_tasks),
      cancelledTasks: Number(member.cancelled_tasks),
      overdueTasks: Number(member.overdue_tasks),
    })),
  }
}

const progressApi = {
  async getGroupProgress(groupId) {
    if (useMock) {
      const [group, tasks] = await Promise.all([
        teamApi.getTeam(groupId),
        mockResolve(
          mockTasks.filter((task) => task.groupId === Number(groupId)),
        ),
      ])
      const groupMembers = mockMembers.filter(
        (member) => member.groupId === Number(groupId) && member.status === 'active',
      )
      const eligibleTasks = tasks.filter((task) => task.status !== 'cancelled')
      const members = groupMembers.map((member) => {
        const assigned = tasks.filter(
          (task) => task.assignedTo === member.userId,
        )
        return {
          userId: member.userId,
          fullName: member.fullName,
          assignedTasks: assigned.length,
          todoTasks: countStatus(assigned, 'todo'),
          inProgressTasks: countStatus(assigned, 'in_progress'),
          completedTasks: countStatus(assigned, 'completed'),
          cancelledTasks: countStatus(assigned, 'cancelled'),
          overdueTasks: assigned.filter(isOverdue).length,
        }
      })

      return {
        group: {
          id: group.id,
          groupCode: group.groupCode,
          groupName: group.groupName,
          status: group.status,
        },
        summary: {
          totalTasks: tasks.length,
          todoTasks: countStatus(tasks, 'todo'),
          inProgressTasks: countStatus(tasks, 'in_progress'),
          completedTasks: countStatus(tasks, 'completed'),
          cancelledTasks: countStatus(tasks, 'cancelled'),
          overdueTasks: tasks.filter(isOverdue).length,
          unassignedTasks: tasks.filter((task) => task.assignedTo == null).length,
          completionPercentage: eligibleTasks.length
            ? Number(
                (
                  (countStatus(tasks, 'completed') / eligibleTasks.length) *
                  100
                ).toFixed(2),
              )
            : 0,
          lastUpdatedAt:
            tasks.toSorted((left, right) =>
              right.updatedAt.localeCompare(left.updatedAt),
            )[0]?.updatedAt ?? null,
        },
        members,
      }
    }

    return mapProgress(
      await unwrap(
        apiClient.get('/progress.php', {
          params: { action: 'group', group_id: groupId },
        }),
      ),
    )
  },
}

export default progressApi
