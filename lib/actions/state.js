'use strict';

function state(player, values, callback) {
  var state = player.getState();
  callback(state);
}

module.exports = function (api) {
  api.registerAction('state', state);
}
