'use strict';

function clearqueue(player, values, callback) {
  callback.invokeIntended = true;
  player.coordinator.removeAllTracksFromQueue(function (error) {
    if (error) {
      callback({ error: error });
    } else {
      callback({ success: true });
    }
  });
}

module.exports = function (api) {
  api.registerAction('clearqueue', clearqueue);
};