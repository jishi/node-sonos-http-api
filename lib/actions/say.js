var crypto = require('crypto');
var fs = require('fs');
var http = require('http');
var path = require('path');
var async = require('async');
var util = require('util');

var settings = {};

try {
  settings = require.main.require('./settings.json');
} catch (e) {
  console.error(e);
}

var saveState = {};
var webroot, port;

// for sayall
var coordinator;
var startPlayingWhenOneBigGroup;

// for say
var groupToRejoin;

// announce volume
var announceVolume = 40;

function say(player, values, callback) {

  var text = values[0],
    language = values[1] || 'en';

  // Create backup preset to restore this player
  var state = player.getState();

  var backupPreset = {
    "players": [
      { "roomName": player.roomName, "volume": state.volume }
    ],
    "state": state.playerState,
    "uri": player.avTransportUri,
    'trackNo': state.trackNo,
    'elapsedTime': state.elapsedTime
  }

  if (player.coordinator.uuid == player.uuid) {
    // This one is coordinator, you will need to rejoin
    // remember which group you were part of.
    group = getGroupByCoordinator(player.discovery.zones, player.coordinator);
    if (group.members.length > 1) {
      console.log('Think its coordinator');
      groupToRejoin = group.id;
    }
  } else {
    groupToRejoin = null;
  }

  // Use the preset action to play the tts file
  var ttsPreset = {
    "players": [
      { "roomName": player.roomName, "volume": announceVolume }
    ],
    "state": "playing",
    "playMode": "NORMAL"
  }

  player.on('transport-state', transportStateClosure(player, [backupPreset]));

  invokeTTS(ttsPreset, text, language, player.discovery);

  callback();
}

function getGroupByCoordinator(zones, coordinator) {
  for (var i = 0; i < zones.length; i++) {
    var zone = zones[i];
    if (coordinator.uuid == zone.uuid) {
      return zone;
    }
  }
}

function getGroupCoordinatorByID(zones, id) {
  for (var i = 0; i < zones.length; i++) {
    var zone = zones[i];
    console.log(zone, id);
    if (id == zone.id) {
      return zone.uuid;
    }
  }
}

function sayAll(player, values, callback) {
  // Save all players
  var backupPresets = saveAll(player);

  var text = values[0],
    language = values[1] || 'en';

  // find biggest group and all players
  var biggestZone = {};
  var allPlayers = [];
  player.discovery.zones.forEach(function (zone) {
    if (!biggestZone.members || zone.members.length > biggestZone.members.length) {
      biggestZone = zone;
    }
  });

  // add coordinator first.
  allPlayers.push({ roomName: biggestZone.coordinator.roomName, volume: announceVolume });
  coordinator = biggestZone.coordinator;

  biggestZone.members.forEach(function (i) {
    // skip coordinator, already added
    if (i.uuid == biggestZone.uuid) return;
    allPlayers.push({ roomName: i.roomName, volume: announceVolume });
  });

  player.discovery.zones.forEach(function (zone) {
    if (biggestZone.uuid == zone.uuid) {
      return;
    }
    // add the rest of the players
    zone.members.forEach(function (i) {
      allPlayers.push({ roomName: i.roomName, volume: announceVolume });
    });
  });


  var preset = {
    players: allPlayers,
    state: (player.discovery.zones.length == 1) ? 'playing' : 'stopped',
    playMode: 'NORMAL'
  }

  invokeTTS(preset, text, language, player.discovery, function () {
    if (preset.state == 'stopped') startPlayingWhenOneBigGroup = true;
  });

  coordinator.on('transport-state', transportStateClosure(coordinator, backupPresets));

  callback();
}

function invokeTTS(preset, text, language, discovery, callback) {
  tryDownloadTTS(text, language, function (success, filename) {
    var uri = "http://" + discovery.localEndpoint + ":" + port + "/tts/" + filename;
    preset.uri = uri;
    discovery.applyPreset(preset, callback);
  });
}

function transportStateClosure(player, backupPresets) {
  var hasStartedPlaying = false;
  return function listener(state) {
    console.log(player.state.currentState, player.avTransportUri);

    if (player.state.currentState == "PLAYING") {
      hasStartedPlaying = true;
      return;
    }

    if (hasStartedPlaying && player.state.currentState == "STOPPED") {
      console.log('reverting to backupPreset')
      var asyncSeries = [];
      backupPresets.forEach(function (backupPreset) {
        asyncSeries.push(function (preset) {
          return function (callback) {

            console.log('groupToRejoin', groupToRejoin)
            if (groupToRejoin) {
              // player was broken out, need to rejoin right coordinator

              preset.uri = 'x-rincon:' + getGroupCoordinatorByID(player.discovery.zones, groupToRejoin);
            }

            console.log('applying preset')
            player.discovery.applyPreset(preset, function (error, result) {
              callback(error, result);
            });
          };
        }(backupPreset));
      });

      async.series(asyncSeries, function (err, result) {
        if (err)
          console.error('error in async series when applying backup', err, result)
      })
      player.removeListener('transport-state', listener);
    }
  }
}

function saveAll(player) {
  var discovery = player.discovery;
  var backupPresets = [];
  discovery.getZones().forEach(function (zone) {
    var player = discovery.getPlayerByUUID(zone.uuid);
    var state = player.getState();
    var preset = {
      'players': [
        { 'roomName': player.roomName, 'volume': state.volume }
      ],
      'state': player.state.currentState,
      'uri': player.avTransportUri,
      'playMode': 'NORMAL',
      'trackNo': state.trackNo,
      'elapsedTime': state.elapsedTime
    }


    zone.members.forEach(function (p) {
      if (player.uuid != p.uuid)
        preset.players.push({ roomName: p.roomName, volume: p.state.volume });
    });

    backupPresets.push(preset);

  });

  return backupPresets;
}


function tryDownloadTTS(phrase, language, callback) {
  if (!settings.voicerss) {
    console.error('You need to register an apikey at http://www.voicerss.org and add it to settings.json!');
    callback(true, '../missing_api_key.mp3');
    return;
  }
  // Use voicerss tts translation service to create a mp3 file
  var tts_request = util.format('http://api.voicerss.org/?key=%s&f=22khz_16bit_mono&hl=%s&src=%s', settings.voicerss, language, phrase);

  // Construct a filesystem neutral filename
  var filename = crypto.createHash('sha1').update(phrase).digest('hex') + '-' + language + '.mp3';
  var filepath = path.resolve(webroot, 'tts', filename);

  // If not already downloaded request translation
  fs.stat(filepath, function (err, stat) {
    if (err) {
      console.log('Downloading new tts message file: ' + filepath);
      var file = fs.createWriteStream(filepath);
      var request = http.get(tts_request, function (response) {
        if (response.statusCode < 300 && response.statusCode >= 200) {
          response.pipe(file);
          file.on('finish', function () {
            file.end();
            callback(true, filename);
          });
        } else {
          console.error('Download failed with status', response.statusCode, response.message);
          callback(false);
        }
      }).on('error', function (err) {
        console.error('could not download file', filename, err);
        fs.unlink(dest);
        callback(false);
      });
    } else {
      console.log('Using cached tts message file: ' + filename);
      callback(true, filename);
    }
  });
}

function topologyChanged(e) {
  if (startPlayingWhenOneBigGroup && e.length == 1) {
    // is one big group now, play
    coordinator.play();
  }
}

module.exports = function (api) {
  webroot = path.resolve(__dirname + '/../../static');
  port = api.getPort();
  api.registerAction('say', say);
  api.registerAction('sayall', sayAll);

  // register permanent eventlistener
  api.discovery.on('topology-change', topologyChanged);
}
