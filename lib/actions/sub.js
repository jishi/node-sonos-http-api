'use strict';

function sub(player, values) {
  if (!player.hasSub) {
    return Promise.reject(new Error('This zone doesn\'t have a SUB connected'));
  }

  const action = values[0];
  const value = values[1];

  switch (action) {
    case 'on':
      return player.subEnable();
    case 'off':
      return player.subDisable();
    case 'gain':
      return player.subGain(value);
    case 'crossover':
      return player.subCrossover(value);
    case 'polarity':
      return player.subPolarity(value);
  }

  return Promise.resolve({
    message: 'Valid options are on, off, gain, crossover, polarity'
  });
}

module.exports = function (api) {
  api.registerAction('sub', sub);
}