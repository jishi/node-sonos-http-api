'use strict';
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const isRadioOrLineIn = require('../helpers/is-radio-or-line-in');
const tryDownloadTTS = require('../helpers/try-download-tts');

let port;
let system;

const announceVolume = 40;
const backupPresets = {};
let settings = {};

try {
  settings = require.main.require('./settings.json');
} catch (e) {
  console.error(e);
}

function say(player, values) {
  const text = values[0];
  let announceVolume;
  let language;

  if (/^\d+$/i.test(values[1])) {
    // first parameter is volume
    announceVolume = values[1];
    language = 'en-gb';
  } else {
    language = values[1] || 'en-gb';
    announceVolume = values[2] || settings.announceVolume || 40;
  }

  // Create backup preset to restore this player
  const state = player.state;

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

  console.log('backup preset was', backupPreset);

  // Use the preset action to play the tts file
  var ttsPreset = {
    "players": [
      { "roomName": player.roomName, "volume": announceVolume }
    ],
    playMode: {
      repeat: false
    }
  };

  let announceFinished;
  let afterPlayingStateChange;

  const onTransportChange = (state) => {
    console.log(this.roomName, player.roomName, state.playbackState);

    if (state.playbackState === 'PLAYING') {
      afterPlayingStateChange = announceFinished;
    }

    if (state.playbackState !== "STOPPED") {
      return;
    }

    if (afterPlayingStateChange instanceof Function) {
      console.log('announcement finished');
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

    console.log('applying preset', relevantBackupPreset);
    return system.applyPreset(relevantBackupPreset);
  }

  return tryDownloadTTS(text, language)
    .then((uri) => {
      ttsPreset.uri = `http://${system.localEndpoint}:${port}${uri}`;
      return system.applyPreset(ttsPreset);
    })
    .then(() => {
      player.on('transport-state', onTransportChange);
      return new Promise((resolve) => {
        announceFinished = resolve;

        abortTimer = setTimeout(() => {
          announceFinished = null;
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
      console.error(err, err.stack);
      player.removeListener('transport-state', onTransportChange);
      return prepareBackupPreset()
        .then(() => {
          // we still want to inform that stuff broke
          throw err;
        });
    });
}

module.exports = function (api) {
  port = api.getPort();
  api.registerAction('say', say);

  system = api.discovery;
}
