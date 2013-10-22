"use strict";

var http = require('http'); 
var fs = require('fs');

function HttpAPI(discovery, port, presets) {


  //var discovery = new SonosDiscovery();
  //var port = 5005;

  var lockVolumes = {};
  

  var server = http.createServer(function (req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/plain;charset=utf8',
      'Cache-Control': 'no-cache' 
    });

    var params = req.url.substring(1).split('/');

    if (params.length < 1) {
      // This is faulty.
      res.end();
      return;
    } else if (params.length == 2 && params[0] == "preset") {
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
      console.log('callback')
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
      case "volume":
        player.setVolume(options.value);
        break;
      case "state":
        var state = player.coordinator.state;
        state.volume = player.state.volume;
        callback(state);
        return;
        break;
      case "seek":
        player.coordinator.seek(options.value);
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
        player.getFavorites(function (success, favorites) {
          console.log("looking for favorite", options.value)
          favorites.forEach(function (item) {
            if (item.title.toLowerCase() == decodeURIComponent(options.value).toLowerCase()) {
              console.log("found it", item)
              
              if (item.uri.startsWith("x-sonosapi-stream")) {
                // This is a radio station, use setAVTransportURI instead.
                player.coordinator.setAVTransportURI(item.uri, item.metaData, function () {
                  player.coordinator.play();
                });
                return;
              }

              player.coordinator.removeAllTracksFromQueue(function (success) {
                if (!success) {
                  console.log("error when removing tracks");
                  return;
                }

                player.coordinator.addURIToQueue(item.uri, item.metaData, function (success) {
                  if (!success) {
                    console.log("problem adding URI to queue");
                    return;
                  }
                  var queueURI = "x-rincon-queue:" + player.coordinator.uuid + "#0";
                  player.coordinator.setAVTransportURI(queueURI, "", function () {
                    player.coordinator.play();
                  });
                });
              });
            }
          });
          
        });
        break;        
      case "favorites":
        player.getFavorites(function (success, favorites) {
          callback(favorites);
        });
        return;
    }

    callback();

  }

  server.listen(port);

  console.log("http server listening on port", port);
}

module.exports = HttpAPI;