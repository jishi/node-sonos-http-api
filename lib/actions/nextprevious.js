'use strict';
function next(player) {
  return player.coordinator.nextTrack();
}

function previous(player) {
  return player.coordinator.previousTrack();
}

module.exports = function (api) {
  api.registerAction('next', next);
  api.registerAction('previous', previous);
}