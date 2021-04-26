'use strict';

function reorderqueue(player, values) {
  const from = values[0];
  const to = values[1];
  const count = values[2] ?? 1;
  return player.coordinator.reorderTracksInQueue(from, count, to);
}

module.exports = function (api) {
  api.registerAction('reorderqueue', reorderqueue);
};
