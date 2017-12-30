'use strict';
const logger = require('sonos-discovery/lib/helpers/logger');
const isRadioOrLineIn = require('../helpers/is-radio-or-line-in');

function saveAll(system) {
  const backupPresets = system.zones.map((zone) => {
    const coordinator = zone.coordinator;
    const state = coordinator.state;
    const preset = {
      players: [
        { roomName: coordinator.roomName, volume: state.volume }
      ],
      state: state.playbackState,
      uri: coordinator.avTransportUri,
      metadata: coordinator.avTransportUriMetadata,
      playMode: {
        repeat: state.playMode.repeat
      }
    };

    if (!isRadioOrLineIn(preset.uri)) {
      preset.trackNo = state.trackNo;
      preset.elapsedTime = state.elapsedTime;
    }

    zone.members.forEach(function (player) {
      if (coordinator.uuid != player.uuid)
        preset.players.push({ roomName: player.roomName, volume: player.state.volume });
    });

    return preset;

  });

  logger.trace('backup presets', backupPresets);
  return backupPresets.sort((a,b) => {
    return a.players.length < b.players.length;
  });
}

function announceAll(system, uri, volume) {
  let abortTimer;

  // Save all players
  var backupPresets = saveAll(system);

  // find biggest group and all players
  const allPlayers = [];
  let biggestZone = {};
  system.zones.forEach(function (zone) {
    if (!biggestZone.members || zone.members.length > biggestZone.members.length) {
      biggestZone = zone;
    }
  });

  const coordinator = biggestZone.coordinator;

  allPlayers.push({ roomName: coordinator.roomName, volume });

  system.players.forEach(player => {
    if (player.uuid == coordinator.uuid) return;
    allPlayers.push({ roomName: player.roomName, volume });
  });

  const preset = {
    uri,
    players: allPlayers,
    playMode: {
      repeat: false
    },
    pauseOthers: true,
    state: 'STOPPED'
  };

  let announceFinished;
  let afterPlayingStateChange;

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

    const abortDelay = coordinator._state.currentTrack.duration + 2;
    clearTimeout(abortTimer);
    logger.debug(`Setting restore timer for ${abortDelay} seconds`);
    abortTimer = setTimeout(() => {
      logger.debug(`Restoring backup preset because ${abortDelay} seconds passed`);
      if (announceFinished instanceof Function) {
        announceFinished();
      }
    }, abortDelay * 1000);

    // This is some odd scenario where STOPPED is emitted when starting playback for some reason.
    coordinator.once('transport-state', onTransportChange);
  };

  const oneGroupPromise = new Promise((resolve) => {
    const onTopologyChanged = (topology) => {
      if (topology.length === 1) {
        return resolve();
      }
      // Not one group yet, continue listening
      system.once('topology-change', onTopologyChanged);
    };

    system.once('topology-change', onTopologyChanged);
  });

  return system.applyPreset(preset)
    .then(() => {
      if (system.zones.length === 1) return;
      return oneGroupPromise;
    })
    .then(() => {
      coordinator.once('transport-state', onTransportChange);
      coordinator.play();
      return new Promise((resolve) => {
        announceFinished = resolve;
      });
    })
    .then(() => {
      clearTimeout(abortTimer);
      announceFinished = undefined;
    })
    .then(() => {
      return backupPresets.reduce((promise, preset) => {
        logger.trace('Restoring preset', preset);
        return promise.then(() => system.applyPreset(preset));
      }, Promise.resolve());
    })
    .catch((err) => {
      logger.error(err.stack);
      throw err;
    });

}

module.exports = announceAll;