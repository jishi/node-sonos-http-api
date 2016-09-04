function favorite(player, values) {
  return player.coordinator.replaceWithFavorite(decodeURIComponent(values[0]));
}

module.exports = function (api) {
  api.registerAction('favorite', favorite);
}
