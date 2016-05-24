'use strict';
const path = require('path');
var crypto = require('crypto');
var fs = require('fs');
var http = require('http');

let webroot;
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

function tryDownloadTTS(phrase, language) {
  if (!settings.voicerss) {
    console.error('You need to register an apikey at http://www.voicerss.org and add it to settings.json!');
    return Promise.resolve(`http://${system.localEndpoint}:${port}/missing_api_key.mp3`);

  }
  // Use voicerss tts translation service to create a mp3 file
  const ttsRequestUrl = `http://api.voicerss.org/?key=${settings.voicerss}&f=22khz_16bit_mono&hl=${language}&src=${phrase}`;

  // Construct a filesystem neutral filename
  const filename = crypto.createHash('sha1').update(phrase).digest('hex') + '-' + language + '.mp3';
  const filepath = path.resolve(webroot, 'tts', filename);

  const expectedUri = `http://${system.localEndpoint}:${port}/tts/${filename}`;
  try {
    fs.accessSync(filepath, fs.R_OK);
    return Promise.resolve(expectedUri);
  } catch (err) {
    console.log(`announce file for phrase "${phrase}" does not seem to exist, downloading`);
  }

  return new Promise((resolve, reject) => {
    var file = fs.createWriteStream(filepath);
    http.get(ttsRequestUrl, function (response) {
      if (response.statusCode < 300 && response.statusCode >= 200) {
        response.pipe(file);
        file.on('finish', function () {
          file.end();
          resolve(expectedUri);
        });
      } else {
        reject(new Error(`Download failed with status ${response.statusCode}, ${response.message}`));

      }
    }).on('error', function (err) {
      fs.unlink(dest);
      reject(err);
    });
  });
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
      backupPreset.trackNo = state.trackNo;
      backupPreset.elapsedTime = state.elapsedTime;
      backupPreset.uri = player.avTransportUri;
      backupPreset.playMode = state.playMode;
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
      ttsPreset.uri = uri;
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
      return prepareBackupPreset();
    });
}

module.exports = function (api) {
  webroot = path.resolve(__dirname + '/../../static');
  port = api.getPort();
  api.registerAction('say', say);

  system = api.discovery;
}
