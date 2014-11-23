function seek(player, values) {
  player.coordinator.seek(values[0]);
}

function trackSeek(player, values) {
  player.coordinator.trackSeek(values[0]*1);
}

module.exports = function (api) {
  api.registerAction('seek', seek);
  api.registerAction('trackseek', trackSeek);
}