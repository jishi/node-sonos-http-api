'use strict';

function dequeue(player, values) {
  const index = values[0];
  return player.coordinator.removeTrackFromQueue(index);
}

module.exports = function (api) {
  api.registerAction('dequeue', dequeue);
};
