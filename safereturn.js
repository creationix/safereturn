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

  var isDone, timer;

  // Allow re-wrapping of callbacks to prevent double wrapping and to allow
  // changing the timeout value.
  if (callback.hasOwnProperty("originalCallback")) {
    callback = callback.originalCallback;
  }
  safeCallback.originalCallback = callback;

  // If timeout value is truthy, then start a timer
  var err = new Error("Original Stack");
  if (timeout) {
    // Create the error early to catch the interesting call stack
    timer = setTimeout(function () {
      // If the callback never get's called, that is bad.  We should warn.
      safeReturn.onTimeout(safeCallback, err);
    }, timeout);
  }

  // Return the wrapped callback
  function safeCallback() {
    if (isDone) {
      // If the callback is called multiple times, this is bad.  We should warn.
      return safeReturn.onDuplicate.call(this, safeCallback, err);
    }
    clearTimeout(timer);
    isDone = true;
    return callback.apply(this, arguments);
  }
  return safeCallback;
}

safeReturn.onDuplicate = onDuplicate;
function onDuplicate(wrappedCallback, oldErr) {
  var err = new Error("Callback called multiple times");
  console.error(err.stack + "\n" + oldErr.stack);
}

safeReturn.onTimeout = onTimeout;
function onTimeout(wrappedCallback, oldErr) {
  var callback = wrappedCallback.originalCallback;
  var err = new Error("Callback timeout expired");
  console.error(err.stack + "\n" + oldErr.stack);
}

// The map function is for async functions that want to do `length` parallel calls.
// Returned is a callback generator per item.  It expects the key as it's input.
// Note that map doesn't duplicate any of the checks from safeReturn.
// Recommended to use with safeReturn.
safeReturn.map = map;
function map(callback, length) {
  // Args check
  if (typeof callback !== "function") throw new TypeError("Callback must be a function.");
  if (typeof length !== "number" || length < 0 || length !== length << 0) {
    throw new TypeError("Length must be a non-negative integer.");
  }
  var result = {};

  // Check for the empty case.
  if (!length) callback(null, result);

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
  };
}

