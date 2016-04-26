'use strict';

function favorites(player, values) {

  return player.system.getFavorites()
    .then((favorites) => {

      if (values[0] === 'detailed') {
        return favorites.items;
      }

      // only present relevant data
      return favorites.items.map(i => i.title);
    });
}

module.exports = function (api) {
  api.registerAction('favorites', favorites);
};
