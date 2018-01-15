'use strict';

function surround(player, values) {
  if (!player.hasSurround) {
    return Promise.reject(new Error('This zone doesn\'t have Surround'));
  }

  const action = values[0];
  const value = values[1];

  return player.setSurround(action, value)

  return Promise.resolve({
    message: 'Valid options are on, off, mode, level, musiclevel'
  });
}

module.exports = function (api) {
  api.registerAction('surround', surround);
}
