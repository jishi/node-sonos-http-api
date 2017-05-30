'use strict';

function nightMode(player, values) {
  const enable = values[0] === 'on';
  return player.nightMode(enable);
}

function speechEnhancement(player, values) {
  const enable = values[0] === 'on';
  return player.speechEnhancement(enable);
}

function balance(player, values) {
  
  const balance = parseInt(values[0]);

  return player.setBalance(balance);

}

module.exports = function (api) {
  api.registerAction('nightmode', nightMode);
  api.registerAction('speechenhancement', speechEnhancement);
  api.registerAction('balance', balance);
}
