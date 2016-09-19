'use strict';

function sleep(player, values) {
  let timestamp = 0;
  if (/^\d+$/.test(values[0])) {
    // only digits
    timestamp = values[0];
  } else if (values[0].toLowerCase() != 'off') {
    // broken input
    return Promise.resolve();
  }
  return player.coordinator.sleep(timestamp);
}

module.exports = function (api) {
  api.registerAction('sleep', sleep);
}