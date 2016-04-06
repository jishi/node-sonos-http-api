function favorite(player, values) {
  return player.coordinator.replaceWithFavorite(values[0]);
}

module.exports = function (api) {
  api.registerAction('favorite', favorite);
}
