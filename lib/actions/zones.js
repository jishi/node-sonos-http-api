'use strict';

function simplifyPlayer(player) {
  if (typeof player === 'undefined') {
    return {};
  }
  return {
    uuid: player.uuid,
    state: player.state,
    playMode: player.currentPlayMode,
    roomName: player.roomName,
    coordinator: player.coordinator.uuid,
    groupState: player.groupState
  };
}

function simplifyZones(zones) {
  return zones.map((zone) => {
    if (typeof zone === 'undefined') {
      return {};
    }
    return {
      uuid: zone.uuid,
      coordinator: simplifyPlayer(zone.coordinator),
      members: zone.members.map(simplifyPlayer)
    };
  });
};

function zones(player) {
  return Promise.resolve(simplifyZones(player.system.zones));
}

module.exports = function (api) {
  api.registerAction('zones', zones);
}
