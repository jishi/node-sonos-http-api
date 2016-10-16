'use strict';
const logger = require('sonos-discovery/lib/helpers/logger');
const isRadioOrLineIn = require('../helpers/is-radio-or-line-in');
let onOneBigGroup;
let globalListenerRegistered = false;

function saveAll(system) {
  const backupPresets = system.zones.map((zone) => {
    var coordinator = zone.coordinator;
    var state = coordinator.state;
    var preset = {
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

  return backupPresets;
}

function topologyChanged() {
  if (onOneBigGroup instanceof Function) {
    onOneBigGroup();
  }
}

function announceAll(system, uri, volume) {
  if (!globalListenerRegistered) {
    system.on('topology-change', topologyChanged);
    globalListenerRegistered = true;
  }

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
    logger.debug(coordinator.roomName, state.playbackState);

    if (state.playbackState === 'PLAYING') {
      afterPlayingStateChange = announceFinished;
    }

    if (state.playbackState !== "STOPPED") {
      return;
    }

    if (afterPlayingStateChange instanceof Function) {
      logger.debug('announcement finished');
      afterPlayingStateChange();
    }
  };

  return system.applyPreset(preset)
    .then(() => {
      if (system.zones.length === 1) return;

      return new Promise((resolve) => {
        onOneBigGroup = resolve;
      })
    })
    .then(() => {
      return coordinator.play();
    })
    .then(() => {
      coordinator.on('transport-state', onTransportChange);
      return new Promise((resolve) => {
        announceFinished = resolve;
      });
    })
    .then(() => {
      logger.debug('removing listener from', coordinator.roomName);
      coordinator.removeListener('transport-state', onTransportChange);
    })
    .then(() => {
      logger.debug(backupPresets);
      return backupPresets.reduce((promise, preset) => {
        return promise.then(() => system.applyPreset(preset));
      }, Promise.resolve());
    })
    .catch((err) => {
      logger.error(err.stack);
      coordinator.removeListener('transport-state', onTransportChange);
    });

}

module.exports = announceAll;