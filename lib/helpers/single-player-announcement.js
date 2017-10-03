'use strict';
const logger = require('sonos-discovery/lib/helpers/logger');
const isRadioOrLineIn = require('../helpers/is-radio-or-line-in');
const backupPresets = {};

function singlePlayerAnnouncement(player, uri, volume, duration) {
// Create backup preset to restore this player
  const state = player.state;
  const system = player.system;

  let groupToRejoin;

  const backupPreset = {
    players: [
      { roomName: player.roomName, volume: state.volume }
    ]
  };

  if (player.coordinator.uuid == player.uuid) {
    // This one is coordinator, you will need to rejoin
    // remember which group you were part of.
    const group = system.zones.find(zone => zone.coordinator.uuid === player.coordinator.uuid);
    if (group.members.length > 1) {
      logger.debug('Think its coordinator, will find uri later');
      groupToRejoin = group.id;
      backupPreset.group = group.id;
    } else {
      // was stand-alone, so keep state
      backupPreset.state = state.playbackState;
      backupPreset.uri = player.avTransportUri;
      backupPreset.metadata = player.avTransportUriMetadata;
      backupPreset.playMode = {
        repeat: state.playMode.repeat
      };

      if (!isRadioOrLineIn(backupPreset.uri)) {
        backupPreset.trackNo = state.trackNo;
        backupPreset.elapsedTime = state.elapsedTime;
      }

    }
  } else {
    // Was grouped, so we use the group uri here directly.
    backupPreset.uri = `x-rincon:${player.coordinator.uuid}`;
  }

  logger.debug('backup state was', backupPreset);

// Use the preset action to play the tts file
  var ttsPreset = {
    players: [
      { roomName: player.roomName, volume }
    ],
    playMode: {
      repeat: false
    },
    uri
  };

  let abortTimer;

  if (!backupPresets[player.roomName]) {
    backupPresets[player.roomName] = [];
  }

  backupPresets[player.roomName].unshift(backupPreset);
  logger.debug('backup presets array', backupPresets[player.roomName]);

  const prepareBackupPreset = () => {
    if (backupPresets[player.roomName].length > 1) {
      backupPresets[player.roomName].shift();
      logger.debug('more than 1 backup presets during prepare', backupPresets[player.roomName]);
      return Promise.resolve();
    }

    if (backupPresets[player.roomName].length < 1) {
      return Promise.resolve();
    }

    const relevantBackupPreset = backupPresets[player.roomName][0];

    logger.debug('exactly 1 preset left', relevantBackupPreset);

    if (relevantBackupPreset.group) {
      const zone = system.zones.find(zone => zone.id === relevantBackupPreset.group);
      if (zone) {
        relevantBackupPreset.uri = `x-rincon:${zone.uuid}`;
      }
    }

    logger.debug('applying preset', relevantBackupPreset);
    return system.applyPreset(relevantBackupPreset)
      .then(() => {
        backupPresets[player.roomName].shift();
        logger.debug('after backup preset applied', backupPresets[player.roomName]);
      });
  }

  let timer;
  const restoreTimeout = duration + 2000;
  return system.applyPreset(ttsPreset)
    .then(() => {
      return new Promise((resolve) => {
        const transportChange = (state) => {
          logger.debug(`Player changed to state ${state.playbackState}`);
          if (state.playbackState === 'STOPPED') {
            return resolve();
          }

          player.once('transport-state', transportChange);
        };
        setTimeout(() => {
          player.once('transport-state', transportChange);
        }, duration / 2);

        logger.debug(`Setting restore timer for ${restoreTimeout} ms`);
        timer = Date.now();
        abortTimer = setTimeout(resolve, restoreTimeout);
      });
    })
    .then(() => {
    const elapsed = Date.now() - timer;
    logger.debug(`${elapsed} elapsed with ${restoreTimeout - elapsed} to spare`);
      clearTimeout(abortTimer);
    })
    .then(prepareBackupPreset)
    .catch((err) => {
      logger.error(err);
      return prepareBackupPreset()
        .then(() => {
          throw err;
        });
    });
}

module.exports = singlePlayerAnnouncement;
