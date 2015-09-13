function addToGroup(player, values) {
  var joiningPlayer = player.discovery.getPlayer(decodeURIComponent(values[0]));
  if(!joiningPlayer) {
    console.log("Room " + values[0] + " not found - can't group with " + player.roomName);
    return;
  }
  attachTo(joiningPlayer, player.coordinator);
}

function joinPlayer(player, values) {
  var receivingPlayer = player.discovery.getPlayer(decodeURIComponent(values[0]));
  if(!receivingPlayer) {
    console.log("Room " + values[0] + " not found - can't make " + player.roomName + " join it");
    return;
  }
  attachTo(player, receivingPlayer.coordinator);
}

function removeFromGroup(player, values) {
  var leavingPlayer = player.discovery.getPlayer(decodeURIComponent(values[0]));
  if(!leavingPlayer) {
    console.log("Room " + values[0] + " not found - can't remove from group of " + player.roomName);
    return;
  }
  leave(leavingPlayer);
}

function rinconUri(player) {
  return "x-rincon:" + player.uuid;
}

function attachTo(player, coordinator, callback) {
  player.setAVTransportURI(rinconUri(coordinator), null, callback);
}

function leave(player) {
  if (player.coordinator == player) {
    player.becomeCoordinatorOfStandaloneGroup();
  } else {
    attachTo(player, player);
  }
}

function isolate(player, values) {
  var discovery = player.discovery;

  var playerToIsolate = discovery.getPlayer(decodeURIComponent(values[0]));
  if(!playerToIsolate) {
    console.log("Room " + values[0] + " not found - can't isolate it");
    return;
  }  

  // Always ensure that playerToIsolate is connected to the coordinator of the source player
  if(player.state.currentState == "PLAYING") {
    attachTo(playerToIsolate, player.coordinator, function() {
      performIsolate(discovery, playerToIsolate);
    });
  }
}

function performIsolate(discovery, playerToIsolate) {
  // Isolate playerToIsolate by calling becomeCoordinatorOfStandaloneGroup() on every other player in its group
  for (var i in discovery.players) {
    var player = discovery.players[i];
    if(playerToIsolate !== player) {
      player.becomeCoordinatorOfStandaloneGroup();
    }
  }
}

module.exports = function (api) {
  api.registerAction('add', addToGroup);
  api.registerAction('isolate', isolate);
  api.registerAction('ungroup', leave);
  api.registerAction('leave', leave);
  api.registerAction('remove', removeFromGroup);
  api.registerAction('join', joinPlayer);
}
