var fs = require('fs');
var safeReturn = require('../safereturn');

function folderInfo(path, callback) {
  callback = safeReturn(callback);
  // Note that we can wrap callbacks we give to other code as well as the ones
  // we provide.  I trust fs.readdir to behave, but if it was some other lib
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


folderInfo("/home/tim", function (err, errors, results) {
  if (err) throw err;
  console.log({errors:errors, results:results});
});
