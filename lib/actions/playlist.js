function playlist(player, values) {
  return player.system.getPlaylists()
    .then((playlists) => {
      console.log(playlists)
      var playlist = playlists.items.find(item => item.title.toLowerCase() == decodeURIComponent(values[0]).toLowerCase());
      if (!playlist) {
        throw new Error(`Could not playlist ${values[0]}`);
      }
      return player.coordinator.replaceQueueWithPlaylist(playlist.uri)
    })
    .then(() => player.coordinator.play());
}

function getPlaylists(player, values) {
  return player.system.getPlaylists()
    .then(playlists => {
      if (values[0] === 'detailed') {
        return playlists.items;
      }

      return playlists.items.map(item => item.title);
    });
}

module.exports = function (api) {
  api.registerAction('playlist', playlist);
  api.registerAction('playlists', getPlaylists);
};
