function mute(player) {
  player.mute(true);
}

function groupMute(player) {
  player.coordinator.groupMute(true);
}

function unmute(player) {
  player.mute(false);
}

function groupUnmute(player) {
  player.coordinator.groupMute(false);
}

module.exports = function (api) {
  api.registerAction('mute', mute);
  api.registerAction('unmute', unmute);
  api.registerAction('groupmute', groupMute);
  api.registerAction('groupunmute', groupUnmute);
}