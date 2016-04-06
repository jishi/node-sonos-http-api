'use strict';

function state(player) {
  return Promise.resolve(player.state);
}

module.exports = function (api) {
  api.registerAction('state', state);
}
