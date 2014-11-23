function zones(player, values, callback) {
  callback(player.discovery.getZones());
}

module.exports = function (api) {
  api.registerAction('zones', zones);
}