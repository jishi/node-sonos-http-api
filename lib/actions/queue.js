'use strict';
function queue(player) {
  return player.coordinator.getQueue(startIndex);
}


module.exports = function (api) {
  api.registerAction('queue', queue);
}
