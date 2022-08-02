'use strict';
function playpause(player) {
  let ret = { status: 'success', paused: false };

  if(player.coordinator.state.playbackState === 'PLAYING') {
    ret.paused = true;
    return player.coordinator.pause().then((response) => { return ret; });
  }

  return player.coordinator.play().then((response) => { return ret; });
}

function play(player) {
 return player.coordinator.play();
}

function pause(player) {
  return player.coordinator.pause();
}

module.exports = function (api) {
  api.registerAction('playpause', playpause);
  api.registerAction('play', play);
  api.registerAction('pause', pause);
}