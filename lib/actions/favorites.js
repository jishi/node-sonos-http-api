function favorites(player, values, callback) {

  callback.invokeIntended = true;
  player.getFavorites(function (error, favorites) {

    if (values[0] === 'detailed') {
      callback(favorites);
      return;
    }

    // only present relevant data
    var simpleFavorites = [];
    favorites.forEach(function (i) {
      simpleFavorites.push(i.title);
    });
    callback(simpleFavorites);
  });
}

module.exports = function (api) {
  api.registerAction('favorites', favorites);
}
