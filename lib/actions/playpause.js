function playpause(player) {
  if(player.coordinator.state['currentState'] == 'PLAYING') {
    return player.coordinator.pause();
  } else {
    return player.coordinator.play();
  }
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