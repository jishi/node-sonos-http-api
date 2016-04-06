function setAVTransportURI(player, values) {
  return player.setAVTransportURI(decodeURIComponent(values[0]));
}

module.exports = function (api) {
  api.registerAction('setavtransporturi', setAVTransportURI);
}