module.exports = safeReturn;
// Default timeout to a second.
safeReturn.defaultTimeout = 1000;
safeReturn.safeReturn = safeReturn;
function safeReturn(callback, timeout) {
  // Args check and optional timeout arg handling
  if (typeof callback !== "function") throw new TypeError("Callback must be a function");
  if (arguments.length === 1) {
    timeout = safeReturn.defaultTimeout;
  } else if (arguments.length === 2) {
    if (typeof timeout !== "number") throw new TypeError("Timeout must be a number");
  } else {
    throw new TypeError("Wrong number of arguments.  Must be 1 or 2");
  }

  // TODO: support callback rewrapping via originalCallback property

  var isDone, timer;

  // If timeout value is truthy, then start a timer
  if (timeout) {
    // Create the error early to catch the interesting call stack
    var timeoutErr = new Error("ETIMEOUT: Callback timeout exceeded");
    timer = setTimeout(function () {
      isDone = true;
      timeoutErr.code = "ETIMEOUT";
      callback(timeoutErr);
    }, timeout);
  }

  // Return the wrapped callback
  return function safeCallback() {
    if (isDone) return;
    clearTimeout(timer);
    isDone = true;
    return callback.apply(this, arguments);
  };
}

// The map function is for async functions that want to do `length` parallel calls.
// Returned is a callback generator per item.  It expects the key as it's input.
// Note that map doesn't duplicate any of the checks from safeReturn.
// Recommended to use with safeReturn.
safeReturn.map = map;
function map(callback, length) {
  // Args check
  if (typeof callback !== "function") throw new TypeError("Callback must be a function.");
  if (typeof length !== "number" || length < 0 || length !== length << 0)
    throw new TypeError("Length must be a non-negative integer.");

  var result = {};

  // Check for the empty case.
  if (!length) callback(err, result);

  return function generator(key) {
    // The first call checks that the key is unique and returns the item callback.
    if (result.hasOwnProperty(key)) {
      return callback(new Error("Duplicate key " + key));
    }
    result[key] = undefined;

    // Put the result in the object and count down to 0 to finish.
    return function itemCallback() {
      result[key] = arguments;
      if (--length === 0) {
        callback(null, result);
      }
    };
  }
}
