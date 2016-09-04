function playpause(player) {
  console.log(player.coordinator.state.playbackState)
  if(player.coordinator.state.playbackState === 'PLAYING') {
    return player.coordinator.pause();
  }

  return player.coordinator.play();
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