function sleep(player, values) {
  var timestamp = 'ERROR';
  if (/^\d+$/.test(values[0])) {
    // only digits, transform to timestamp
    timestamp = formatTime(values[0], true);
  } else if (values[0] == 'off') {
    timestamp = '';
  } else {
    // assume a timestamp
    timestamp = values[0];
  }
  console.log(timestamp)
  player.coordinator.sleep(timestamp);
}

function formatTime(time, alwaysHours) {
  var chunks = [];
  var modulus = [60^2, 60];
  var remainingTime = time;
  // hours
  var hours = Math.floor(remainingTime/3600);

  if (hours > 0 || alwaysHours) {
    chunks.push(hours.zpad(2));
    remainingTime -= hours * 3600;
  }

  // minutes
  var minutes = Math.floor(remainingTime/60);
  chunks.push(minutes.zpad(2));
  remainingTime -= minutes * 60;
  // seconds
  chunks.push(remainingTime.zpad(2))

  return chunks.join(':');
}

module.exports = function (api) {
  api.registerAction('sleep', sleep);
}