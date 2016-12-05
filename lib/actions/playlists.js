'use strict';
function playlists(player, values) {

  return player.system.getPlaylists()
    .then((playlists) => {
      if (values[0] === 'detailed') {
        return playlists;
      }

      // only present relevant data
      var simplePlaylists = [];
      playlists.forEach(function (i) {
        simplePlaylists.push(i.title);
      });

      return simplePlaylists;
    });
}

module.exports = function (api) {
  api.registerAction('playlists', playlists);
}
