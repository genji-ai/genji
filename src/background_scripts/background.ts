import { GenjiMessage } from '../lib/messages/schema'
import { Tasks } from '../lib/storage/tasks'

chrome.runtime.onStartup.addListener(() => {
  // TODO: hope that this code completes before any content script checks for pending tasks
  return Tasks.clearIncompleteTasks()
})

chrome.runtime.onMessage.addListener(
  (request: GenjiMessage, sender: chrome.runtime.MessageSender, sendResponse) => {
    if (request.type === 'sender-query') {
      const resp = {
        id: sender?.tab?.id,
        url: sender?.tab?.url,
        title: sender?.tab?.title,
      }
      sendResponse(resp)
    } else if (request.type === 'screenshot') {
      chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
        sendResponse(dataUrl)
      })
    } else if (['push-message', 'task-update', 'fetch-action-error'].includes(request.type)) {
      chrome.tabs.sendMessage(sender.tab!.id!, request)
      sendResponse()
    } else {
      sendResponse('error request: ' + JSON.stringify(request, null, 2))
    }
    return true
  },
)
