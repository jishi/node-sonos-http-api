'use strict';
function mute(player) {
  return player.mute();
}

function groupMute(player) {
  return player.coordinator.muteGroup();
}

function unmute(player) {
  return player.unMute();
}

function groupUnmute(player) {
  return player.coordinator.unMuteGroup();
}

function toggleMute(player) {
  let ret = { status: 'success', muted: true };

  if(player.state.mute) {
    ret.muted = false;
    return player.unMute().then((response) => { return ret; });
  };
  
  return player.mute().then((response) => { return ret; });
}

module.exports = function (api) {
  api.registerAction('mute', mute);
  api.registerAction('unmute', unmute);
  api.registerAction('groupmute', groupMute);
  api.registerAction('groupunmute', groupUnmute);
  api.registerAction('mutegroup', groupMute);
  api.registerAction('unmutegroup', groupUnmute);
  api.registerAction('togglemute', toggleMute);
}
