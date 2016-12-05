'use strict';
function setAVTransportURI(player, values) {
  return player.setAVTransport(decodeURIComponent(values[0]));
}

module.exports = function (api) {
  api.registerAction('setavtransporturi', setAVTransportURI);
}