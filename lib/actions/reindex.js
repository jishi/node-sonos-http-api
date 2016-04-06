function reindex(player) {
  return player.refreshShareIndex();
}

module.exports = function (api) {
  api.registerAction('reindex', reindex);
}