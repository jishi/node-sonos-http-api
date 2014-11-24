function next(player) {
  player.coordinator.nextTrack();
}

function previous(player) {
  player.coordinator.previousTrack();
}

module.exports = function (api) {
  api.registerAction('next', next);
  api.registerAction('previous', previous);
}