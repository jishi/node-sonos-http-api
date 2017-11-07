'use strict';
const logger = require('sonos-discovery/lib/helpers/logger');

function addToGroup(player, values) {
  const joiningRoomName = decodeURIComponent(values[0]);
  const joiningPlayer = player.system.getPlayer(joiningRoomName);
  if(!joiningPlayer) {
    logger.warn(`Room ${joiningRoomName} not found - can't group with ${player.roomName}`);
    return Promise.reject(new Error(`Room ${joiningRoomName} not found - can't group with ${player.roomName}`));
  }
  return attachTo(joiningPlayer, player.coordinator);
}

function joinPlayer(player, values) {
  const receivingRoomName = decodeURIComponent(values[0]);
  const receivingPlayer = player.system.getPlayer(receivingRoomName);
  if(!receivingPlayer) {
    logger.warn(`Room ${receivingRoomName} not found - can't make ${player.roomName} join it`);
    return Promise.reject(new Error(`Room ${receivingRoomName} not found - can't make ${player.roomName} join it`));
  }
  return attachTo(player, receivingPlayer.coordinator);
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
  api.registerAction('join', joinPlayer);
}
