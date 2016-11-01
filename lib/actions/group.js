'use strict';
const logger = require('sonos-discovery/lib/helpers/logger');

function addToGroup(player, values) {
  const joiningRoomName = decodeURIComponent(values[0]);
  const joiningPlayer = player.system.getPlayer(joiningRoomName);
  if(!joiningPlayer) {
    logger.warn(`Room ${joiningRoomName} not found - can't group with ${player.roomName}`);
    return;
  }
  return attachTo(joiningPlayer, player.coordinator);
}

function joinPlayer(player, values) {
  const receivingRoomName = decodeURIComponent(values[0]);
  const receivingPlayer = player.system.getPlayer(receivingRoomName);
  if(!receivingPlayer) {
    logger.warn(`Room ${receivingRoomName} not found - can't make ${player.roomName} join it`);
    return;
  }
  return attachTo(player, receivingPlayer.coordinator);
}

function removeFromGroup(player, values) {
  const leavingRoomName = decodeURIComponent(values[0]);
  var leavingPlayer = player.system.getPlayer(leavingRoomName);
  if(!leavingPlayer) {
    logger.warn(`Room ${leavingRoomName} not found - can't remove from group of ${player.roomName}`);
    return;
  }
  return isolate(leavingPlayer);
}

function rinconUri(player) {
  return `x-rincon:${player.uuid}`;
}

function attachTo(player, coordinator) {
  return player.setAVTransport(rinconUri(coordinator));
}

function isolate(player) {
  return player.becomeCoordinatorOfStandaloneGroup();
}

module.exports = function (api) {
  api.registerAction('add', addToGroup);
  api.registerAction('isolate', isolate);
  api.registerAction('ungroup', isolate);
  api.registerAction('leave', isolate);
  api.registerAction('remove', removeFromGroup);
  api.registerAction('join', joinPlayer);
}
