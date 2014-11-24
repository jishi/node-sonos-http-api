function setAVTransportURI(player, values) {
  player.setAVTransportURI(values[0]);
}

module.exports = function (api) {
  api.registerAction('setavtransporturi', setAVTransportURI);
}