import React from 'react'
import ReactDOM from 'react-dom/client'
import { Chat } from '../components/Chat'
import { MessageStorage } from '../lib/storage/messages'
import { Tasks } from '../lib/storage/tasks'

MessageStorage.getMessages()
  .then(({ tabID, messages }) => {
    Tasks.getPendingTask().then((task) => {
      chrome.storage.local.get('genjiEnabled').then(({ genjiEnabled }) => {
        // default is true
        if (genjiEnabled === undefined) {
          genjiEnabled = true
        }

        // Create div for Genji to live in
        const genjiDiv = document.createElement('div')
        genjiDiv.id = 'genji-root'
        genjiDiv.style.position = 'fixed'
        genjiDiv.style.zIndex = '10000000'
        document.documentElement.appendChild(genjiDiv)

        // Render Genji
        ReactDOM.createRoot(genjiDiv).render(
          <React.StrictMode>
            <Chat
              tabID={tabID}
              existingMessages={messages}
              pendingTaskExists={task !== null}
              genjiEnabled={genjiEnabled}
            />
          </React.StrictMode>,
        )
      })
    })
  })
  .catch((err) => {
    console.log(`failed to initialize chat: ${err}`)
  })
