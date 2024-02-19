'use strict';

function linein(player, values) {
  const sourcePlayerName = values[0];
  const altInput = values[1];
  let lineinSourcePlayer = player;

  if (sourcePlayerName) {
    lineinSourcePlayer = player.system.getPlayer(decodeURIComponent(sourcePlayerName));
  }

  if (!lineinSourcePlayer) {
    return Promise.reject(new Error(`Could not find player ${sourcePlayerName}`));
  }
  let uri
  if (altInput === "spdif") {
    uri = `x-sonos-htastream:${lineinSourcePlayer.uuid}:spdif`;

  } else {
    uri = `x-rincon-htastream:${lineinSourcePlayer.uuid}`;
  }

  return player.coordinator.setAVTransport(uri)
    .then(() => player.coordinator.play());
}

module.exports = function (api) {
  api.registerAction('linein', linein);
}
