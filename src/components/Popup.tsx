import { useState } from 'react'
import GenjiLogo from '../imgs/genji-logo.svg?react'

type PopupProps = {
  genjiEnabled: boolean
}

export default function Popup({ genjiEnabled }: PopupProps) {
  const [isEnabled, setIsEnabled] = useState(genjiEnabled)

  const toggle = async () => {
    const currentEnabled = isEnabled

    // Toggle in the popup
    setIsEnabled(!currentEnabled)

    // Save the new toggle state in persistent storage
    await chrome.storage.local.set({
      ['genjiEnabled']: !currentEnabled,
    })

    // Send a message to the active tab to update the toggle state immediately for the active tba
    // We chose not to send it to all tabs as it triggers can't connect errors for tabs that don't have the extension
    // Instead, the user must reload all non-active tabs to for the state to update in the web page
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    await chrome.tabs.sendMessage(tabs[0].id!, {
      type: 'update-enabled',
      newEnabled: !currentEnabled,
    })
  }

  const popupContainerStyles = {
    width: '200px',
  }

  const genjiRowStyles = {
    display: 'flex',
    // https://github.com/cssinjs/jss/issues/1344
    flexDirection: 'row' as const,
    gap: '10px',
    marginTop: '10px',
    justifyContent: 'center',
    padding: '0 10px',
  }

  const manualTextStyles = {
    fontSize: '10px',
    padding: '10px',
  }

  return (
    <div style={popupContainerStyles}>
      <div style={genjiRowStyles}>
        <GenjiLogo width={'30px'} height={'100%'} />
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <span>Enabled</span>
          <input type={'checkbox'} name={'Enabled'} checked={isEnabled} onChange={toggle} />
        </div>
      </div>
      <div style={manualTextStyles}>
        Click the ninja icon at the bottom right corner of your screen and give Genji a command to
        get started.
      </div>
    </div>
  )
}
