'use strict';

function volume(player, values) {
  let channel;
  let volume;
  if (/^\d+$/i.test(values[0])) {
    channel = 'Master';
    volume = values[0];
  } else {
    channel = values[0];
    volume = values[1];
  }
  return player.setVolume(volume, channel);
}

function balance(player, values) {
  let level = values[0];
  return player.setBalance(level);
}

function groupVolume(player, values) {
  return player.coordinator.setGroupVolume(values[0]);
}

module.exports = function (api) {
  api.registerAction('volume', volume);
  api.registerAction('balance', balance);
  api.registerAction('groupvolume', groupVolume);
}
