'use strict';

function nightMode(player, values) {
  const enable = values[0] === 'on';
  return player.nightMode(enable);
}

function speechEnhancement(player, values) {
  const enable = values[0] === 'on';
  return player.speechEnhancement(enable);
}

module.exports = function (api) {
  api.registerAction('nightmode', nightMode);
  api.registerAction('speechenhancement', speechEnhancement);
}
