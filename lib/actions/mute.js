function mute(player) {
  return player.mute();
}

function groupMute(player) {
  return player.coordinator.groupMute();
}

function unmute(player) {
  return player.unMute();
}

function groupUnmute(player) {
  return player.coordinator.groupUnMute();
}

module.exports = function (api) {
  api.registerAction('mute', mute);
  api.registerAction('unmute', unmute);
  api.registerAction('groupmute', groupMute);
  api.registerAction('groupunmute', groupUnmute);
}