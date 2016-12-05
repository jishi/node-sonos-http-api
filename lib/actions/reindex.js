'use strict';
function reindex(player) {
  return player.system.refreshShareIndex();
}

module.exports = function (api) {
  api.registerAction('reindex', reindex);
}