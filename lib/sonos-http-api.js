"use strict";

var http = require('http');
var fs = require('fs');

function HttpAPI(discovery, port, presets) {

  var lockVolumes = {};
  var pauseState = {};

  // This is to handle setTimeout
  function pauseAll() {
    pauseState = {};
    discovery.getZones().forEach(function (zone) {
      pauseState[zone.uuid] = zone.coordinator.state.zoneState;
      if (pauseState[zone.uuid] == "PLAYING") {
        var player = discovery.getPlayerByUUID(zone.uuid);
        player.pause();
      }
    });
  }

  function resumeAll() {
        // save state for resume
    for (var uuid in pauseState) {
      if (pauseState[uuid] == "PLAYING") {
        var player = discovery.getPlayerByUUID(uuid);
        player.play();
      }
    }

    // Clear the pauseState to prevent a second resume to raise hell
    pauseState = {};
  }


  var server = http.createServer(function (req, res) {
    res.writeHead(200, {
      'Content-Type': 'application/json;charset=utf8',
      'Cache-Control': 'no-cache',
	'Access-Control-Allow-Origin' : '*'
    });

    var params = req.url.substring(1).split('/');

    if (params.length < 1 || params[0] == "favicon.ico") {
      // This is faulty.
      res.end();
      return;
    } else if (params.length == 2 && ["preset", "pauseall", "resumeall"].some(function (i) { return params[0] == i; })) {
      // Handle presets
      var opt = {
        action: params[0],
        value: params[1]
      };
    } else if (params.length > 1) {


      var opt = {
        room: params[0],
        action: params[1],
        value: params[2]
      };

    } else {
      // guessing zones
      var opt = {
        action: params[0]
      }
    }

    var response = handleAction(opt, function (response) {
      if (response) {
        var jsonResponse = JSON.stringify(response);
        res.write(new Buffer(jsonResponse));
      }
      res.end();
    });
  });

  function restrictVolume(info) {
    console.log("should revert volume to", lockVolumes[info.uuid]);
    var player = discovery.getPlayerByUUID(info.uuid);
    // Only do this if volume differs
    if (player.state.volume != lockVolumes[info.uuid])
      player.setVolume(lockVolumes[info.uuid]);
  }

  function handleAction(options, callback) {
    console.log(options)

    if (options.action === "zones") {
      callback(discovery.getZones());
      return;
    }

    if (options.action == "preset") {
      // Apply preset
      var value = decodeURIComponent(options.value);
      if (value.startsWith('{'))
        var preset = JSON.parse(value);
      else
        var preset = presets[value];

      console.log("applying preset", preset)

      if (preset)
        discovery.applyPreset(preset);

      callback();
      return;
    }

    if (options.action == "lockvolumes") {
        console.log("locking volumes");
        // Locate all volumes
        for (var i in discovery.players) {
          var player = discovery.players[i];
          lockVolumes[i] = player.state.volume;
        }
        // prevent duplicates, will ignore if no event listener is here
        discovery.removeListener("volume", restrictVolume);
        discovery.on("volume", restrictVolume);
        callback();
        return;
    }

     if (options.action == "unlockvolumes") {
        console.log("unlocking volumes");
        discovery.removeListener("volume", restrictVolume);
        callback();
        return;
    }

    if (options.action == "pauseall") {

      console.log("pausing all players");
      // save state for resume

      if (options.value && options.value > 0) {
        console.log("in", options.value, "minutes");
        setTimeout(function () { pauseAll(); }, options.value*1000*60);
      } else {
        pauseAll();
      }

      callback();

    }

    if (options.action == "resumeall") {
        console.log("resuming all players");

        if (options.value && options.value > 0) {
        console.log("in", options.value, "minutes");
        setTimeout(function () { resumeAll(); }, options.value*1000*60);
      } else {
        resumeAll();
      }

      callback();
      return;
    }


    var roomName = decodeURIComponent(options.room);
    var player = discovery.getPlayer(roomName);
    if (!player) {
      callback();
      return;
    }

    switch (options.action.toLowerCase()) {
      case "play":
        player.coordinator.play();
        break;
      case "pause":
        player.coordinator.pause();
        break;
      case "playpause":
        if(player.coordinator.state['currentState'] == "PLAYING") {
          player.coordinator.pause();
        } else {
          player.coordinator.play();
        }
        break;
      case "volume":
        player.setVolume(options.value);
        break;
      case "groupvolume":
        player.coordinator.groupSetVolume(options.value);
        break;
      case "mute":
        player.mute(true);
        break;
      case "unmute":
        player.mute(false);
        break;
      case "groupmute":
        player.coordinator.groupMute(true);
        break;
      case "groupunmute":
        player.coordinator.groupMute(false);
        break;
      case "state":
        var state = player.getState();
        callback(state);
        return;
        break;
      case "seek":
        player.coordinator.seek(options.value);
        break;
      case "trackseek":
        player.coordinator.trackSeek(options.value*1);
        break;
      case "next":
        player.coordinator.nextTrack();
        break;
      case "previous":
        player.coordinator.previousTrack();
        break;
      case "setavtransport":
        player.setAVTransportURI(options.value);
        break;
      case "favorite":
        player.coordinator.replaceWithFavorite(options.value, function (success) {
          if (success)
            player.coordinator.play();
        });
        break;
      case "repeat":
        player.coordinator.repeat(options.value == "on" ? true : false);
        break;
      case "shuffle":
        player.coordinator.shuffle(options.value == "on" ? true : false);
        break;
      case "favorites":
        player.getFavorites(function (success, favorites) {
          // only present relevant data
          var simpleFavorites = [];
          console.log(favorites)
          favorites.forEach(function (i) {
            simpleFavorites.push(i.title);
          });
          callback(simpleFavorites);
        });
        return;
    }

    callback();

  }

  server.listen(port);

  console.log("http server listening on port", port);
}

module.exports = HttpAPI;
