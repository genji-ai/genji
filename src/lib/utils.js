// Reproduced with modifications from https://github.com/philc/vimium/blob/master/lib/utils.js

export const Utils = {

  // The Firefox browser name and version can only be reliably accessed from the browser page using
  // browser.runtime.getBrowserInfo(). This information is passed to the frontend via the
  // initializeFrame message, which sets each of these values. These values can also be set using
  // Utils.populateBrowserInfo().
  // TODO: support firefox
  _browserInfoLoaded: true,
  _firefoxVersion: null,
  _isFirefox: false,

  // This should only be used by content scripts. Background pages should use BgUtils.isFirefox().
  isFirefox() {
    if (!this._browserInfoLoaded) throw Error("browserInfo has not yet loaded.");
    return this._isFirefox;
  },

  // This should only be used by content scripts. Background pages should use
  // BgUtils.firefoxVersion().
  firefoxVersion() {
    if (!this._browserInfoLoaded) throw Error("browserInfo has not yet loaded.");
    return this._firefoxVersion;
  },

  // detects both literals and dynamically created strings
  isString(obj) {
    return (typeof obj === "string") || obj instanceof String;
  },
}
