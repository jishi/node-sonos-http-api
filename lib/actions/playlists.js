function playlists(player, values, callback) {

  callback.invokeIntended = true;
  player.getPlaylists(function (error, playlists) {

    if (values[0] === 'detailed') {
      callback(playlists);
      return;
    }

    // only present relevant data
    var simplePlaylists = [];
    playlists.forEach(function (i) {
      simplePlaylists.push(i.title);
    });
    callback(simplePlaylists);
  });
}

module.exports = function (api) {
  api.registerAction('playlists', playlists);
}
