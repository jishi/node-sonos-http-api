'use strict';
function repeat(player, values) {
  let mode = values[0];
  let ret = { status: 'success' };

  if (mode === "on") {
    mode = "all";
  } else if (mode === "off") {
    mode = "none";
  } else if (mode === "toggle") {
    switch (player.coordinator.state.playMode.repeat) {
      case 'all': mode = "one"; break;
      case 'one': mode = "off"; break;
      default:    mode = "all";
    }
    ret.repeat = mode;
  }

  return player.coordinator.repeat(mode).then((response) => {
    return (!response || response.constructor.name === 'IncomingMessage') ? ret : response;
  });
}

function shuffle(player, values) {
  let enable = values[0] === "on";
  let ret = { status: 'success' };
  if(values[0] == "toggle") enable = ret.shuffle = !player.coordinator.state.playMode.shuffle;
  return player.coordinator.shuffle(enable).then((response) => {
    return (!response || response.constructor.name === 'IncomingMessage') ? ret : response;
  });
}

function crossfade(player, values) {
  let enable = values[0] === "on";
  let ret = { status: 'success' };
  if(values[0] == "toggle") enable = ret.crossfade = !player.coordinator.state.playMode.crossfade;
  return player.coordinator.crossfade(enable).then((response) => {
    return (!response || response.constructor.name === 'IncomingMessage') ? ret : response;
  });
}

module.exports = function (api) {
  api.registerAction('repeat', repeat);
  api.registerAction('shuffle', shuffle);
  api.registerAction('crossfade', crossfade);
}