'use strict';

function surround(player, values) {
  if (!player.hasSurround) {
    return Promise.reject(new Error('This zone doesn\'t have Surround'));
  }

  const action = values[0];
  const value = values[1];

  return player.setSurround(action, value);

}

module.exports = function (api) {
  api.registerAction('surround', surround);
}
