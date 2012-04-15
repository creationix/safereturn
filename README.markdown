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

Note that map doesn't duplicate any of the checks from safeReturn. It's 
recommended to use in conjuction with safeReturn.

## Techniques

Yep, that's the whole API.  The real power comes in techniques.  Remember a goal
of SafeReturn is to not reimplement all possible control-flow patterns, but to
enable and assist you the programmer.

### Serial Chain

Sometimes you want to start some async action, wait for it to finish, and then
do something else.  This is easiest done with nesting.  

```js
function myAction(param, callback) {
  callback = safeReturn(callback);
  doSomething(param, function (err, data) {
    if (err) return callback(err);
    // Notice we used data and param from the closure.  Nesting is great for simple stuff.
    doAnother(data, param, callback);
  });
}
```

It can also be accomplished with named functions.

```js
function folderInfo(path, callback) {
  callback = safeReturn(callback);
  // Note that we can wrap callbacks we give to other code as well as the ones
  // we're given.  I trust fs.readdir to behave, but if it was some other lib
  // I might not trust it and want to wrap the callback.
  fs.readdir(path, safeReturn(onReaddir)); 
  
  function onReaddir(err, files) {
    if (err) return callback(err);
    var onItem = safeReturn.map(onStats, files.length);
    files.forEach(function (name) {
      // Here we wrap the onItem callback to ensure all of them fire exactly once
      // This will ensure out next step eventually fires.
      fs.stat(path + "/" + name, safeReturn(onItem(name)));
    });
  }
  
  function onStats(err, obj) {
    if (err) return callback(err);
    // Massage the data format to be what we want to output.
    var results = {};
    var errors = {};
    Object.keys(obj).forEach(function (name) {
      var value = obj[name];
      if (value[0]) errors[name] = value[0];
      else results[name] = value[1];
    });
    callback(null, errors, results);
  }
}
```

### Branching and other Advanced Topics

Branching or other advanced techniques can still be done unlike in Step.  
Remember this is freeform JavaScript.  All functions in SafeReturn accept the
callback (or next step) as input.  This means you can route logic in whatever
direction you want. SafeReturn is very flexible.  Come up with some really neat
examples and send a pull request to have them added here.

(See full examples in the examples folder)
