// Reproduced with modifications from https://github.com/philc/vimium/blob/master/lib/utils.js

// Only pass events to the handler if they are marked as trusted by the browser.
// This is kept in the global namespace for brevity and ease of use.
export const forTrusted = (handler) =>
  function (event) {
    if (event && event.isTrusted) {
      return handler.apply(this, arguments)
    } else {
      return true
    }
  }

if (globalThis.forTrusted == null) {
  globalThis.forTrusted = forTrusted
}
