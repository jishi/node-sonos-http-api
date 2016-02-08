function queue(player, values, callback) {
  var startIndex = 0;
  var count = 500;
  if (values.length == 1) {
    //start index has been specified, keep default count
    startIndex = values[0];
  } else if (values.length == 2 && parseInt(values[1]) > 0) {
    //both start index and count have been specified
    startIndex = values[0];
    count = values[1]
  } else if (values.length > 2) {
    callback({ "err": "incorrect queue index or count" })
    return
  }
  callback.invokeIntended = true;
  player.getQueue(startIndex, count, function (error, data) {
    if (!error) {
      callback(data)
    } else {
      callback({ "err": error })
    }
  });

}


module.exports = function (api) {
  api.registerAction('queue', queue);
}