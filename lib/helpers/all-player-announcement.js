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

function announceAll(system, uri, volume, duration) {
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

  const restoreTimeout = duration + 2000;
  return system.applyPreset(preset)
    .then(() => {
      if (system.zones.length === 1) return;
      return oneGroupPromise;
    })
    .then(() => {
      coordinator.play();
      return new Promise((resolve) => {
        const transportChange = (state) => {
          logger.debug(`Player changed to state ${state.playbackState}`);
          if (state.playbackState === 'STOPPED') {
            return resolve();
          }

          coordinator.once('transport-state', transportChange);
        };
        setTimeout(() => {
          coordinator.once('transport-state', transportChange);
        }, duration / 2);

        logger.debug(`Setting restore timer for ${restoreTimeout} ms`);
        abortTimer = setTimeout(resolve, restoreTimeout);
      });
    })
    .then(() => {
      clearTimeout(abortTimer);
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
