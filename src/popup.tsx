import React from 'react'
import ReactDOM from 'react-dom/client'
import Popup from './components/Popup'

chrome.storage.local.get('genjiEnabled').then(({ genjiEnabled }) => {
  // default is true
  if (genjiEnabled === undefined) {
    genjiEnabled = true
  }

  console.log('popup genjiEnabled: ' + genjiEnabled)
  ReactDOM.createRoot(document.body).render(
    <React.StrictMode>
      <Popup genjiEnabled={genjiEnabled} />
    </React.StrictMode>,
  )
})
