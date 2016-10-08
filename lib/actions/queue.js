'use strict';
function queue(player) {
  return player.coordinator.getQueue();
}

module.exports = function (api) {
  api.registerAction('queue', queue);
}
