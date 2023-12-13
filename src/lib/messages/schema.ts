import { ActionResponse, ErrorResponse, MessageModel, Task } from '../storage/schema'

// Messages exchanged between the service worker and content scripts
// (or between react and non-react components of the content scripts)
export type GenjiMessage =
  | NewTaskAdminMessage
  | ActionAdminMessage
  | ToggleAdmin
  | SenderQueryMessage
  | ScreenshotMessage
  | TaskUpdateMessage
  | PushChatMessageMessage
  | FetchActionErrorMessage
  | UpdateEnabledMessage

export type NewTaskAdminMessage = {
  type: 'new-task-admin'
  command: string
}

export type ActionAdminMessage = {
  type: 'action-admin'
  action: ActionResponse
}

export type ToggleAdmin = {
  type: 'toggle-admin'
}

export type SenderQueryMessage = {
  type: 'sender-query'
}

export type ScreenshotMessage = {
  type: 'screenshot'
}

export type TaskUpdateMessage = {
  type: 'task-update'
  update: TaskUpdateType
  task: Task
}

export type TaskUpdateType = 'new-task' | 'add-step' | 'finalize-task' | 'status-change'

export type PushChatMessageMessage = {
  type: 'push-message'
  content: MessageModel
}

export type FetchActionErrorMessage = {
  type: 'fetch-action-error'
  tabID: number
  resp: ErrorResponse
}

export type UpdateEnabledMessage = {
  type: 'update-enabled'
  newEnabled: boolean
}
