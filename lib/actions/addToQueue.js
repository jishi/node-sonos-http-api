'use strict';

function addtoqueue(player, values) {
  const uri = decodeURIComponent(values[0]);
  const enqueueAsNext = values[1];
  const desiredFirstTrackNumberEnqueued = values[2];
  const metadata = "";
  return player.coordinator.addURIToQueue(uri, metadata, enqueueAsNext, desiredFirstTrackNumberEnqueued);
}

module.exports = function (api) {
  api.registerAction('addtoqueue', addtoqueue);
};
