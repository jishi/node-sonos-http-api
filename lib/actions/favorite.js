function favorite(player, values) {
  player.coordinator.replaceWithFavorite(values[0], function (success) {
    if (success)
      player.coordinator.play();
  });
}

module.exports = function (api) {
  api.registerAction('favorite', favorite);
}