// Reproduced with modifications from https://github.com/philc/vimium/blob/master/content_scripts/vimium_frontend.js

import { DomUtils } from './dom_utils.js'
import { forTrusted } from './forTrusted.js'

// We track whther the current window has the focus or not.
export const windowIsFocused = (function () {
  let windowHasFocus = null
  DomUtils.documentReady(() => (windowHasFocus = document.hasFocus()))
  globalThis.addEventListener(
    'focus',
    forTrusted(function (event) {
      if (event.target === window) {
        windowHasFocus = true
      }
      return true
    }),
    true,
  )
  globalThis.addEventListener(
    'blur',
    forTrusted(function (event) {
      if (event.target === window) {
        windowHasFocus = false
      }
      return true
    }),
    true,
  )
  return () => windowHasFocus
})()

Object.assign(globalThis, {
  windowIsFocused,
})
