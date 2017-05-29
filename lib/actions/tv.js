'use strict';

function tv(player, values) {
  let lineinSourcePlayer = player;

  if (!lineinSourcePlayer) {
    return Promise.reject(new Error(`Could not find player ${sourcePlayerName}`));
  }

  const uri = `x-sonos-htastream:${lineinSourcePlayer.uuid}:spdif`;

  return player.coordinator.setAVTransport(uri)
    .then(() => player.coordinator.play());
}

module.exports = function (api) {
  api.registerAction('tv', tv);
}
