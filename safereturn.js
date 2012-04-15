module.exports = safeReturn;
// Wrapper to make sure a callback is only fired once, but eventually fires
function safeReturn(callback, timeout) {
  if (typeof callback !== "function") throw new Error("Callback must be function");
  var isDone;
  timeout = timeout || 60000;  // Nice slow default timeout
  var timer = setTimeout(function () {
    isDone = true;
    callback(new Error("Callback timeout exceeded"));
  }, timeout);
  return function callback() {
    if (isDone) return;
    clearTimeout(timer);
    isDone = true;
    return callback.apply(this, arguments);
  };
}
