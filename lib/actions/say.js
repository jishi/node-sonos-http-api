var crypto = require('crypto');
var fs = require('fs');
var http = require('http');

var saveState = {};

function say(webroot, port) {
  return function (player, values, callback) {

    var text = values[0],
        language = values[1] || 'en';

    // Use Google tts translation service to create a mp3 file
    var tts_request = "http://translate.google.com/translate_tts?ie=UTF-8&q=" + text + "&tl=" + language;

    console.log(player)

    // Construct a filesystem neutral filename
    var phrase = decodeURIComponent(text);
    var filename = crypto.createHash('sha1').update(phrase).digest('hex') + '-' + language + '.mp3';
    var filepath = webroot + '/tts/' + filename;

    // If not already downloaded request translation
    fs.stat(filepath, function (err, stat) {
       if (err) {
          console.log("Downloading new tts message file: " + filepath);
          var file = fs.createWriteStream(filepath);
          var request = http.get(tts_request, function (response) {
              response.pipe(file);
              file.on('finish', function () {
                file.end();
              });
          }).on('error', function (err) {
            console.error('could not download file', filename, err);
            fs.unlink(dest);
          });
       } else {
          console.log("Using cached tts message file: " + filepath);
       }
    });

    // Create backup preset to restore this player
    var state = player.getState();

    var backupPreset = {
        "players": [
            {"roomName": player.roomName, "volume": state.volume}
        ],
        "state": state.playerState,
        "uri": player.avTransportUri
    }

    // Use the preset action to play the tts file
    var ttsPreset = {
        "players": [
            {"roomName": player.roomName, "volume": player.getState().volume}
        ],
        "state": "play",
        "uri": "http://" + player.discovery.localEndpoint + ":" + port + "/tts/" + filename,
        "playMode": "NORMAL"
    }
    player.discovery.applyPreset(ttsPreset, function () {
      player.on('transport-state', getApplyBackupClosure(backupPreset, player));
    });



  }
}

function getApplyBackupClosure(backupPreset, player) {
  console.log('backup', backupPreset);
  return function listener(state) {
    console.log('reset', state)
    if (player.state.currentState == "STOPPED") {
      player.discovery.applyPreset(backupPreset);
      player.removeListener('transport-state', listener);
    }
  }
}


function saveAll(player) {
  var discovery = player.discovery;

  discovery.getZones().forEach(function (zone) {
     if (zone.coordinator.state.zoneState == "PLAYING") {
        var player = discovery.getPlayerByUUID(zone.uuid);
        var state = player.getState();
        saveState[zone.uuid] = {
          "players": [
              {"roomName": player.roomName, "volume": state.volume}
          ],
          "state": "play",
          "uri": state.currentTrack.uri,
          "playMode": "NORMAL"
        }
     }
  });
}

function restoreAll(player) {
  for (var uuid in saveState) {
    // Use the preset action to restore the saved state
    player.discovery.applyPreset(saveState[uuid]);
  }
}


module.exports = function (api) {
  var webroot = api.getWebRoot();
  var port = api.getPort();
  api.registerAction('say', say(webroot, port));
}