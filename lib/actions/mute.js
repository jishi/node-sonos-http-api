function mute(player) {
  return player.mute(true);
}

function groupMute(player) {
  return player.coordinator.groupMute(true);
}

function unmute(player) {
  return player.mute(false);
}

function groupUnmute(player) {
  return player.coordinator.groupMute(false);
}

module.exports = function (api) {
  api.registerAction('mute', mute);
  api.registerAction('unmute', unmute);
  api.registerAction('groupmute', groupMute);
  api.registerAction('groupunmute', groupUnmute);
}