'use strict';

function simplify(items) {
  return items
  .map(item => {
    return {
      title: item.title,
      artist: item.artist,
      album: item.album,
      albumArtUri: item.albumArtUri
    }
  });
}

function queue(player, values) {
  const detailed = values[0] === 'detailed';

  const promise = player.coordinator.getQueue();

  if (detailed) {
    return promise;
  }

  return promise.then(simplify);
}

module.exports = function (api) {
  api.registerAction('queue', queue);
}
