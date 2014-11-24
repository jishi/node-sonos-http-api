function playpause(player) {
  if(player.coordinator.state['currentState'] == 'PLAYING') {
    player.coordinator.pause();
  } else {
    player.coordinator.play();
  }
}

function play(player) {
  player.coordinator.play();
}

function pause(player) {
  player.coordinator.pause();
}

module.exports = function (api) {
  api.registerAction('playpause', playpause);
  api.registerAction('play', play);
  api.registerAction('pause', pause);
}