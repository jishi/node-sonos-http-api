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

  let announceFinished;
  let afterPlayingStateChange;
  let abortTimer;

  const onTransportChange = (state) => {
    // Short circuit if this announcement has been finished.
    if (!announceFinished) {
      return;
    }
    logger.debug(`playback state switched to ${state.playbackState}`);
    // if (state.playbackState !== 'STOPPED') {
    //   player.once('transport-state', onTransportChange);
    // }

    if (state.playbackState === 'STOPPED' && afterPlayingStateChange instanceof Function) {
      logger.debug('announcement finished because of STOPPED state identified');
      afterPlayingStateChange();
      afterPlayingStateChange = undefined;
      return;
    }

    if (state.playbackState === 'PLAYING') {
      afterPlayingStateChange = announceFinished;
    }

    const abortDelay = player._state.currentTrack.duration + 2;
    clearTimeout(abortTimer);
    logger.debug(`Setting restore timer for ${abortDelay} seconds`);
    abortTimer = setTimeout(() => {
      logger.debug(`Restoring backup preset because ${abortDelay} seconds passed`);
      if (announceFinished instanceof Function) {
        announceFinished();
      }
    }, abortDelay * 1000);

    // This is some odd scenario where STOPPED is emitted when starting playback for some reason.
    player.once('transport-state', onTransportChange);
  };

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
        console.log('after backup preset applied', backupPresets[player.roomName]);
      });
  }

  return system.applyPreset(ttsPreset)
    .then(() => {
      // Remove any lingering event listener before attaching a new one
      player.once('transport-state', onTransportChange);
      return new Promise((resolve) => {
        announceFinished = resolve;
      });
    })
    .then(() => {
      clearTimeout(abortTimer);
      announceFinished = undefined;
      // player.removeListener('transport-state', onTransportChange);
    })
    .then(prepareBackupPreset)
    .catch((err) => {
      logger.error(err);
      // player.removeListener('transport-state', onTransportChange);
      return prepareBackupPreset()
        .then(() => {
          // we still want to inform that stuff broke
          throw err;
        });
    });
}

module.exports = singlePlayerAnnouncement;