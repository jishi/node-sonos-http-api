function timeSeek(player, values) {
  return player.coordinator.timeSeek(values[0]);
}

function trackSeek(player, values) {
  return player.coordinator.trackSeek(values[0]*1);
}

module.exports = function (api) {
  api.registerAction('seek', timeSeek); // deprecated
  api.registerAction('timeSeek', timeSeek);
  api.registerAction('trackseek', trackSeek);
}