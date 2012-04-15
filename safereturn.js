module.exports = safeReturn;
// Default timeout to a second.
safeReturn.defaultTimeout = 1000;
function safeReturn(callback, timeout) {
  if (typeof callback !== "function") throw new TypeError("Callback must be function");
  var isDone, timer;
  if (timeout === undefined) timeout = safeReturn.defaultTimeout;
  if (timeout) {
    // Create the error early to catch the interesting call stack
    var timeoutErr = new Error("Callback timeout exceeded");
    timer = setTimeout(function () {
      isDone = true;
      callback(timeoutErr);
    }, timeout);
  }
  return function safeCallback() {
    if (isDone) return;
    clearTimeout(timer);
    isDone = true;
    return callback.apply(this, arguments);
  };
}

