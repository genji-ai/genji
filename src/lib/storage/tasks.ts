import * as uuid from 'uuid'
import { GenjiMessage, TaskUpdateType } from '../messages/schema'
import { ActionResponse, GenjiStorage, PendingTask, Task, TaskStatus } from './schema'

export const Tasks = {
  // Runs on startup to clear any incomplete tasks
  async clearIncompleteTasks() {
    const allData = await chrome.storage.local.get(null)

    // remove all pending tasks
    const pendingTaskKeys: string[] = allData
      .keys()
      .filter((key: string) => key.startsWith('pending'))
    await chrome.storage.local.remove(pendingTaskKeys)

    // update all task statuses
    const updates: GenjiStorage = {}
    pendingTaskKeys.forEach((pendingTask) => {
      const taskID = allData[pendingTask].taskID
      const task = taskID && allData[`tasks.${taskID}`]
      if (task) {
        updates[`tasks.${taskID}`] = Object.assign({}, task, { status: 'incomplete' })
      }
    })
    await chrome.storage.local.set(updates)
  },

  // Get the pending task, if it exists
  async getPendingTask() {
    const tab = await chrome.runtime.sendMessage({ type: 'sender-query' } as GenjiMessage)
    const pendingTaskKey = `pending.${tab.id}`
    const pendingTask = await chrome.storage.local.get(pendingTaskKey)
    if (pendingTask[pendingTaskKey]?.taskID) {
      const key = `tasks.${pendingTask[pendingTaskKey].taskID}`
      const task = await chrome.storage.local.get(key)
      if (task[key]) return task[key]
    }
    return null
  },

  // Register a new task and return it
  async newTask(description: string) {
    const tab = await chrome.runtime.sendMessage({ type: 'sender-query' } as GenjiMessage)
    const id = uuid.v4()
    const pendingTask: PendingTask = { taskID: id }
    const task: Task = {
      id,
      description,
      status: 'active',
      tabID: tab.id!,
      steps: [],
    }
    await chrome.storage.local.set({
      [`pending.${tab.id}`]: pendingTask,
      [`tasks.${id}`]: task,
    })
    await chrome.runtime.sendMessage({
      type: 'task-update',
      update: 'new-task',
      task,
    } as GenjiMessage)
    return task
  },

  // Add the backend's response as a new step in the task
  async addStep(task: Task, resp: ActionResponse) {
    const tab = await chrome.runtime.sendMessage({ type: 'sender-query' } as GenjiMessage)
    task.steps.push({
      currentTab: {
        url: tab.url!,
        title: tab.title!,
      },
      response: resp,
    })

    await chrome.storage.local.set({ [`tasks.${task.id}`]: task })
    await chrome.runtime.sendMessage({
      type: 'task-update',
      update: 'add-step',
      task,
    } as GenjiMessage)
  },

  async updateStatus(task: Task, status: TaskStatus, statusReason?: string) {
    task.status = status
    if (statusReason) task.statusReason = statusReason
    await chrome.storage.local.set({ [`tasks.${task.id}`]: task })

    let update: TaskUpdateType = 'status-change'
    if (['done', 'failed', 'incomplete', 'cancelled'].includes(status)) {
      update = 'finalize-task'
      await chrome.storage.local.remove(`pending.${task.tabID}`)
    }
    await chrome.runtime.sendMessage({ type: 'task-update', update, task } as GenjiMessage)
  },
}
