function queue(player, values) {
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
    Promise.reject('incorrect queue index or count');

  }
  return player.coordinator.getQueue(startIndex, count);
}


module.exports = function (api) {
  api.registerAction('queue', queue);
}
