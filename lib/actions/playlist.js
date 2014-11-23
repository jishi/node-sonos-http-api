function playlist(player, values) {
  player.getPlaylists(function (success, playlists) {
    playlists.forEach(function (item) {
      if (item.title.toLowerCase() == decodeURIComponent(values[0]).toLowerCase()) {
        console.log('found playlist', item.title, item.uri);
        player.coordinator.replaceQueueWithPlaylist(item.uri.toLowerCase(), function (success) {
          if (success) {
            console.log("replaced queue with playlist "+ item.title + ".");
            player.coordinator.play();
          }
        });
      }
    });
  });
}
module.exports = function (api) {
  api.registerAction('playlist', playlist);
}