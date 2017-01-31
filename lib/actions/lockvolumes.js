'use strict';
const logger = require('sonos-discovery/lib/helpers/logger');
const lockVolumes = {};

function lockvolumes(player) {
  logger.debug('locking volumes');
  // Locate all volumes
  var system = player.system;

  system.players.forEach((player) => {
    lockVolumes[player.uuid] = player.state.volume;
  });

  // prevent duplicates, will ignore if no event listener is here
  system.removeListener('volume-change', restrictVolume);
  system.on('volume-change', restrictVolume);
  return Promise.resolve();
}

function unlockvolumes(player) {
  logger.debug('unlocking volumes');
  var system = player.system;
  system.removeListener('volume-change', restrictVolume);
  return Promise.resolve();
}

function restrictVolume(info) {
  logger.debug(`should revert volume to ${lockVolumes[info.uuid]}`);
  const player = this.getPlayerByUUID(info.uuid);
  // Only do this if volume differs
  if (player.state.volume != lockVolumes[info.uuid])
    return player.setVolume(lockVolumes[info.uuid]);
}

module.exports = function (api) {
  api.registerAction('lockvolumes', lockvolumes);
  api.registerAction('unlockvolumes', unlockvolumes);
}