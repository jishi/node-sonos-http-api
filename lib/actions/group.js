function addToGroup(player, values) {
  var joiningPlayer = player.system.getPlayer(decodeURIComponent(values[0]));
  if(!joiningPlayer) {
    console.error("Room " + values[0] + " not found - can't group with " + player.roomName);
    return;
  }
  return attachTo(joiningPlayer, player.coordinator);
}

function joinPlayer(player, values) {
  var receivingPlayer = player.system.getPlayer(decodeURIComponent(values[0]));
  if(!receivingPlayer) {
    console.error("Room " + values[0] + " not found - can't make " + player.roomName + " join it");
    return;
  }
  return attachTo(player, receivingPlayer.coordinator);
}

function removeFromGroup(player, values) {
  var leavingPlayer = player.system.getPlayer(decodeURIComponent(values[0]));
  if(!leavingPlayer) {
    console.error("Room " + values[0] + " not found - can't remove from group of " + player.roomName);
    return;
  }
  return isolate(leavingPlayer);
}

function rinconUri(player) {
  return "x-rincon:" + player.uuid;
}

function attachTo(player, coordinator) {
  return player.setAVTransport(rinconUri(coordinator));
}

function isolate(player) {
  if (player.coordinator == player) {
    return player.becomeCoordinatorOfStandaloneGroup();
  } else {
    return attachTo(player, player);
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
