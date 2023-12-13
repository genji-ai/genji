import { DomUtils } from '../lib/dom_utils.js'
import { Genji } from '../lib/genji.js'
import '../lib/globals.js'
import { Tasks } from '../lib/storage/tasks'

DomUtils.documentReady(() => {
  addStyle('style.css')
  addGoogleFonts(['Fira Sans Condensed'])

  // wait for all page elements to load
  // TODO: more precise way to determine this
  setTimeout(() => {
    Tasks.getPendingTask().then(Genji.runNextStep.bind(Genji))
  }, 2000)
})

function addStyle(file: string) {
  const styleEl = DomUtils.createElement('style')
  const cssUrl = chrome.runtime.getURL(file)
  styleEl.textContent = `@import url("${cssUrl}");`
  document.head.appendChild(styleEl)
}

function addGoogleFonts(fonts: string[]) {
  const styleSheet = document.createElement('style')

  const baseURL = 'https://fonts.googleapis.com/css2?'
  const encodedFonts = fonts.map((font) => 'family=' + font.trim().replace(/\s+/g, '+')).join('&')

  styleSheet.textContent = `@import url(${baseURL}${encodedFonts}&display=swap);`
  document.head.appendChild(styleSheet)
}
