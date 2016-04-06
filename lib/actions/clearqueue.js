'use strict';

function clearqueue(player) {
  return player.coordinator.clearQueue();
}

module.exports = function (api) {
  api.registerAction('clearqueue', clearqueue);
};