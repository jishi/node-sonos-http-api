'use strict';

function clearqueue(player, values, callback) {
  callback.invokeIntended = true;
  player.removeAllTracksFromQueue(function (success) {
    callback({success: success});
  });
}

module.exports = function (api) {
  api.registerAction('clearqueue', clearqueue);
};