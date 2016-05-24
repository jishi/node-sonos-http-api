'use strict';
const path = require('path');
var crypto = require('crypto');
var fs = require('fs');
var http = require('http');
let webroot;
let port;
let system;

const announceVolume = 40;
let settings = {};

try {
  settings = require.main.require('./settings.json');
} catch (e) {
  console.error(e);
}

let onOneBigGroup;

function saveAll(player) {
  var system = player.system;

  const backupPresets = system.zones.map((zone) => {
    var coordinator = zone.coordinator;
    var state = coordinator.state;
    var preset = {
      players: [
        { roomName: coordinator.roomName, volume: state.volume }
      ],
      state: state.playbackState === 'PLAYING' ? 'play' : 'stopped',
      uri: coordinator.avTransportUri,
      playMode: state.playMode,
      trackNo: state.trackNo,
      elapsedTime: state.elapsedTime
    }


    zone.members.forEach(function (player) {
      if (coordinator.uuid != player.uuid)
        preset.players.push({ roomName: player.roomName, volume: player.state.volume });
    });

    return preset;

  });

  return backupPresets;
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

function sayAll(player, values) {
  // Save all players
  var backupPresets = saveAll(player);

  const text = values[0];
  const language = values[1] || 'en-gb';

  console.log(backupPresets);

  // find biggest group and all players
  var biggestZone = {};
  var allPlayers = [];
  system.zones.forEach(function (zone) {
    if (!biggestZone.members || zone.members.length > biggestZone.members.length) {
      biggestZone = zone;
    }
  });

  const coordinator = biggestZone.coordinator;

  allPlayers.push({ roomName: coordinator.roomName, volume: announceVolume });

  system.players.forEach(player => {
    if (player.uuid == coordinator.uuid) return;
    allPlayers.push({ roomName: player.roomName, volume: announceVolume });
  });

  const preset = {
    players: allPlayers,
    playMode: {
      repeat: false
    },
    pauseOthers: true,
    state: 'STOPPED'
  };

  let announceFinished;

  const onTransportChange = (state) => {
    console.log(state.playbackState);
    if (state.playbackState !== "STOPPED") {
      return;
    }

    if (announceFinished instanceof Function) {
      console.log('announcement finished');
      announceFinished();
    }
  };

  coordinator.on('transport-state', onTransportChange);

  return tryDownloadTTS(text, language)
    .then(uri => {
      preset.uri = uri;
      return system.applyPreset(preset);
    })
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
      return new Promise((resolve) => {
        announceFinished = resolve;
      });
    })
    .then(() => {
      player.removeListener('transport-state', onTransportChange);
    })
    .then(() => {
      console.dir(backupPresets, { depth: 5 });
      return Promise.all(backupPresets.map(preset => system.applyPreset(preset)));
    });

}

function topologyChanged() {
  if (onOneBigGroup instanceof Function) {
    onOneBigGroup();
  }
}

module.exports = function (api) {
  webroot = path.resolve(__dirname + '/../../static');
  port = api.getPort();
  api.registerAction('sayall', sayAll);

  // register permanent eventlistener
  system = api.discovery;
  system.on('topology-change', topologyChanged);
}