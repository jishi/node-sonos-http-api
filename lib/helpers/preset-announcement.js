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
  return backupPresets.sort((a, b) => {
    return a.players.length < b.players.length;
  });
}

function announcePreset(system, uri, preset, duration) {
  let abortTimer;

  // Save all players
  var backupPresets = saveAll(system);

  const simplifiedPreset = {
    uri,
    players: preset.players,
    playMode: preset.playMode,
    pauseOthers: true,
    state: 'STOPPED'
  };

  function hasReachedCorrectTopology(zones) {
    return zones.some(group =>
    group.members.length === preset.players.length &&
    group.coordinator.roomName === preset.players[0].roomName);
  }

  const oneGroupPromise = new Promise((resolve) => {
    const onTopologyChanged = (topology) => {
      if (hasReachedCorrectTopology(topology)) {
        return resolve();
      }
      // Not one group yet, continue listening
      system.once('topology-change', onTopologyChanged);
    };

    system.once('topology-change', onTopologyChanged);
  });

  const restoreTimeout = duration + 2000;
  const coordinator = system.getPlayer(preset.players[0].roomName);
  return coordinator.pause()
    .then(() => system.applyPreset(simplifiedPreset))
    .catch(() => system.applyPreset(simplifiedPreset))
    .then(() => {
      if (hasReachedCorrectTopology(system.zones)) return;
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

module.exports = announcePreset;