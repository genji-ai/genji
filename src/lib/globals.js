// Reproduced with modifications from https://github.com/philc/vimium/blob/master/lib/utils.js

Array.copy = (array) => Array.prototype.slice.call(array, 0)

String.prototype.reverse = function () {
  return this.split('').reverse().join('')
}
