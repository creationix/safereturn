# SafeReturn

SafeReturn is a tiny script that contains functional helpers for callback based code.

## Purpose

To make writing vanilla callback based code more enjoyable.

This package eases the pain, but still allows using free-form callbacks.

Libraries that attempt to manage your control-flow for you are doing it wrong.
Instead SafeReturn makes it easier to do it yourself the right way. 

Functions can be defined anywhere.  They are just values.  They close over
their local state and can carry it with them.  This is very powerful and simple!

Well formed async functions obey some additional rules:

 - Async functions must return either a value or error in the callback.
 - The callback must eventually fire and only once.
 - Async function must never throw exceptions except for argument errors.
 - ...

Writing the boilerplate to check these conditions is tedious and error-prone.
SafeReturn wants to help.

## Non-Goals

 - Not require any special syntax, function block, or indentation.  Must only
   consume a small amount of vertical space.
 - Not appear to be blocking or sequential in any way.  Better to embrace callbacks.

## API

### `safeReturn(callback, timeout) -> wrappedCallback`

This function is the main API.  It takes in your callback and returns a safe wrapped
version of the callback.  Optional is a timeout override for this wrapping.  The global
default timeout can be changed at `safeReturn.defaultTimeout`.  A timeout of `0`
means to disable the timeout.

This wrapped function will only fire once and (if timers are enabled) always fire.

```js
function funkyStatFile(path, callback) {  
  callback = safeReturn(callback); // Make sure our callback *always* fires once.
  if (Math.random() > 0.92) return; // Sometimes it just doesn't work right?
  fs.stat(path, callback); // Make the real call.
  if (Math.random() > 0.92) fs.stat(path, callback); // Twice for fun, right?
}
```

### `safeReturn.map(callback, length) -> itemCallbackGenerator`

This is for functions that want to do `length` async operations in parallel.
It takes the callback and the number of items you expect to do in parallel.  It
returns a function that should be called in each loop iteration (passing in the
index key) to get the callback for that item.

```js
function readdir(path, callback) {
  callback = safeReturn(callback, 0); // Wrap, but disable timeout
  fs.readdir(path, function (err, names) {
    if (err) return callback(err); // If readdir failed, we're done.  Abort.
    // Use the map helper to call our callback once names.length item callbacks fire.
    var onItem = safeReturn.map(callback, names.length);
    names.forEach(function (name) {
      // Note that onItem isn't the actual callback, but returns one when called.
      funkyStatFile(path + "/" + name, onItem(name));
    });
  });
}
```

(See full examples in the examples folder)
