'use strict';
const logger = require('sonos-discovery/lib/helpers/logger');
const isRadioOrLineIn = require('../helpers/is-radio-or-line-in');
const backupPresets = {};

function singlePlayerAnnouncement(player, uri, volume) {
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
      console.log('Think its coordinator, will find uri later');
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

  logger.debug('backup preset was', backupPreset);

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

  let announceFinished;
  let afterPlayingStateChange;

  const onTransportChange = (state) => {
    logger.debug(`playback state switched to ${state.playbackState}`);
    if (state.playbackState === 'PLAYING') {
      logger.debug('I believe announcement starts here');
      afterPlayingStateChange = announceFinished;
    }

    if (state.playbackState !== "STOPPED") {
      return;
    }

    if (afterPlayingStateChange instanceof Function) {
      logger.debug('announcement finished because of STOPPED state identified');
      afterPlayingStateChange();
    }
  };

  let abortTimer;

  if (!backupPresets[player.roomName]) {
    backupPresets[player.roomName] = [];
  }

  backupPresets[player.roomName].unshift(backupPreset);

  const prepareBackupPreset = () => {
    const relevantBackupPreset = backupPresets[player.roomName].shift();

    if (!relevantBackupPreset) {
      return;
    }

    if (backupPresets[player.roomName].length > 0) {
      return Promise.resolve();
    }

    if (relevantBackupPreset.group) {
      const zone = system.zones.find(zone => zone.id === relevantBackupPreset.group);
      if (zone) {
        relevantBackupPreset.uri = `x-rincon:${zone.uuid}`;
      }
    }

    logger.debug('applying preset', relevantBackupPreset);
    return system.applyPreset(relevantBackupPreset);
  }

  return system.applyPreset(ttsPreset)
    .then(() => {
      player.on('transport-state', onTransportChange);
      return new Promise((resolve) => {
        announceFinished = resolve;
        abortTimer = setTimeout(() => {
          announceFinished = null;
          logger.debug('Restoring backup preset because 30 seconds passed');
          resolve();
        }, 30000);
      });
    })
    .then(() => {
      clearTimeout(abortTimer);
      player.removeListener('transport-state', onTransportChange);
    })
    .then(prepareBackupPreset)
    .catch((err) => {
      logger.error(err, err.stack);
      player.removeListener('transport-state', onTransportChange);
      return prepareBackupPreset()
        .then(() => {
          // we still want to inform that stuff broke
          throw err;
        });
    });
}

module.exports = singlePlayerAnnouncement;