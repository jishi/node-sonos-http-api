'use strict';

function state(player, values, callback) {
  var state = player.getState();

  if (state.currentTrack.albumArtURI.startsWith('/')) {
    state.currentTrack.albumArtURI = fixAlbumArtURI(player.address, state.currentTrack.albumArtURI);
  }

  callback(state);
}

function fixAlbumArtURI(address, uri) {
  return 'http://' + address + ':1400' + uri;
}

module.exports = function (api) {
  api.registerAction('state', state);
}