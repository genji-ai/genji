import { GenjiMessage } from '../messages/schema'
import { MessageModel } from './schema'

export const MessageStorage = {
  async clearMessages(tabID: number) {
    await chrome.storage.local.remove(`messages.${tabID}`)
  },

  async getMessages(tabID?: number) {
    if (!tabID) {
      const tab = await chrome.runtime.sendMessage({ type: 'sender-query' } as GenjiMessage)
      tabID = tab.id!
    }
    const resp = await chrome.storage.local.get(`messages.${tabID}`)
    let messages: MessageModel[]
    const introMessage = {
      sender: 'genji',
      message: 'Hi! How can I help?',
    }
    if (resp[`messages.${tabID}`] && Array.isArray(resp[`messages.${tabID}`])) {
      messages = resp[`messages.${tabID}`]
      messages = [introMessage, ...messages]
    } else {
      messages = [introMessage]
    }
    return { tabID: tabID!, messages }
  },

  async addMessage(tabID: number, message: MessageModel) {
    const key = `messages.${tabID}`
    const messages = await chrome.storage.local.get(key)

    const newMessages = [...(messages[key] ?? []), message]
    await chrome.storage.local.set({
      [key]: newMessages,
    })

    // notify chat interface about message
    await chrome.runtime.sendMessage({ type: 'push-message', content: message } as GenjiMessage)
  },
}
