function reindex(player, values, callback) {
  // Find first player available.
  callback.invokeIntended = true;
  player.refreshShareIndex(callback);
}

module.exports = function (api) {
  api.registerAction('reindex', reindex);
}