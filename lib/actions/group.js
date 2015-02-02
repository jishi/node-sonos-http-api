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
  isolate(leavingPlayer);
}

function rinconUri(player) {
  return "x-rincon:" + player.uuid;
}

function attachTo(player, coordinator) {
  player.setAVTransportURI(rinconUri(coordinator));
}

function isolate(player) {
  if (player.coordinator == player) {
    var newCoordinator = null;
    var playerUri = rinconUri(player);
    for (other in player.discovery.players) {
      var otherPlayer = player.discovery.players[other]
      if(otherPlayer == player || otherPlayer.coordinator != player) {
        // avoid self and players on other groups
        continue;
      }
      if (newCoordinator == null) {
        newCoordinator = otherPlayer;
      }
      attachTo(otherPlayer, newCoordinator);
    }
  } else {
    attachTo(player, player);
  }
}

module.exports = function (api) {
  api.registerAction('add', addToGroup);
  api.registerAction('isolate', isolate);
  api.registerAction('ungroup', isolate);
  api.registerAction('leave', isolate);
  api.registerAction('remove', removeFromGroup);
  api.registerAction('join', joinPlayer);
}
