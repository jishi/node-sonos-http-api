'use strict';

function state(player, values, callback) {
  var state = player.getState();
  state.currentTrack.absoluteAlbumArtURI = fixAlbumArtURI(player.address, state.currentTrack.albumArtURI);
  state.nextTrack.absoluteAlbumArtURI = fixAlbumArtURI(player.address, state.nextTrack.albumArtURI);
  callback(state);
}

function fixAlbumArtURI(address, uri) {
  return 'http://' + address + ':1400' + uri;
}

module.exports = function (api) {
  api.registerAction('state', state);
}