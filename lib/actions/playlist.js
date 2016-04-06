function playlist(player, values) {
  player.system.getPlaylists()
    .then((playlists) => {
      var playlist = playlists.find((item) => item.title.toLowerCase() == decodeURIComponent(values[0]).toLowerCase());
      return player.coordinator.replaceQueueWithPlaylist(playlist.uri)
    })
    .then(() => player.coordinator.play());
}
module.exports = function (api) {
  api.registerAction('playlist', playlist);
};
