function favorites(player, values, callback) {
  callback.invokeIntended = true;
  player.getFavorites(function (success, favorites) {
    // only present relevant data
    var simpleFavorites = [];
    console.log(favorites)
    favorites.forEach(function (i) {
      simpleFavorites.push(i.title);
    });
    callback(simpleFavorites);
  });
}

module.exports = function (api) {
  api.registerAction('favorites', favorites);
}