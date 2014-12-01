function volume(player, values) {
  var volume = values[0];
  player.setVolume(volume);
}

function groupVolume(player, values) {
  player.coordinator.groupSetVolume(values[0]);
}

module.exports = function (api) {
  api.registerAction('volume', volume);
  api.registerAction('groupvolume', groupVolume);
}