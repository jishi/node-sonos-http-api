function reindex(player) {
  // Find first player available.
  player.refreshShareIndex(callback);
}

module.exports = function (api) {
  api.registerAction('reindex', reindex);
}