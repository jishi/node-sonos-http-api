'use strict';

function favorites(player, values) {

  return player.system.getFavorites()
    .then((favorites) => {

      if (values[0] === 'detailed') {
        return favorites;
      }

      // only present relevant data
      var simpleFavorites = [];
      favorites.forEach(function (i) {
        simpleFavorites.push(i.title);
      });
      return simpleFavorites;
    });
}

module.exports = function (api) {
  api.registerAction('favorites', favorites);
};
