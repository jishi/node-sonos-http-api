'use strict';

function playlist(player, values) {
  return player.system.getPlaylists()
    .then((playlists) => {
      var playlist = playlists.find(item => item.title.toLowerCase() == decodeURIComponent(values[0]).toLowerCase());
      if (!playlist) {
        throw new Error(`Could not playlist ${values[0]}`);
      }

      return player.coordinator.clearQueue()
        .then(() => player.coordinator.addURIToQueue(playlist.uri));
    })
    .then(() => player.coordinator.setAVTransport(`x-rincon-queue:${player.coordinator.uuid}#0`))
    .then(() => player.coordinator.play());
}

module.exports = function (api) {
  api.registerAction('playlist', playlist);
};
