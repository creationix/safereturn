var fs = require('fs');
var safeReturn = require('../safereturn');

// This function is short and sweet, but has some misbehaving code in it.
// These bad parts are representative of real problems in the wild.
// The callback may never fire sometimes, the callback may get called multiple
// times.  One line at the top fixes all these problems without needing to change
// anything else.
function funkyStatFile(path, callback) {  
  callback = safeReturn(callback); // Make sure our callback *always* fires once.
  if (Math.random() > 0.92) return; // Sometimes it just doesn't work right?
  fs.stat(path, callback); // Make the real call.
  if (Math.random() > 0.92) fs.stat(path, callback); // Twice for fun, right?
}


// Read a directory.  This function isn't misbehaving, but shows the map helper.
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

// Kick off the code and see if it works
readdir(__dirname + "/..", function (err, results) {
  if (err) throw err;
  console.log(results);
});
