// chrome.storage.local shape:
export type GenjiStorage = {
  // "pending.<tabID>": PendingTask
  // "tasks.<uuid>": Task
  // "messages.<tabID>": ChatMessage[]
  [key: string]: PendingTask | Task | MessageModel[]
}

export type PendingTask = {
  taskID: string // the task id of the pending task in this tab
}

export type Task = {
  id: string // the uuid of this task
  description: string // user entered task request
  status: TaskStatus // the status of the task
  tabID: number // the active tab's id
  steps: TaskStep[] // a list of the steps already taken for this task
  statusReason?: string // optional explanation of the current status
}

export type MessageModel = {
  sender: string
  message: string
}

// a task may be incomplete due to an undetected failure or a user interruption
export type TaskStatus = 'active' | 'done' | 'failed' | 'incomplete' | 'cancelling' | 'cancelled'

export type TaskStep = {
  currentTab: {
    url: string
    title: string
  }
  response: ActionResponse
}

export type ActionResponse = {
  action: NavigateAction | ClickAction | TypeAction | DoneAction
  explanation: string
}

export type ErrorResponse = {
  errorMessage: string
  statusCode: number
}

export type NavigateAction = {
  type: 'navigate'
  url: string
}

export type ClickAction = {
  type: 'click'
  hintString: string
}

export type TypeAction = {
  type: 'type'
  content: string
  hintString: string
}

export type DoneAction = 'done'
