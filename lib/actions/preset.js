'use strict';
const fs = require('fs');
const util = require('util');
const logger = require('sonos-discovery/lib/helpers/logger');
const presets = require('../presets-loader');

function presetsAction(player, values) {
  const value = decodeURIComponent(values[0]);
  let preset;
  if (value.startsWith('{')) {
    preset = JSON.parse(value);
  } else {
    preset = presets[value];
  }

  if (preset) {
    return player.system.applyPreset(preset);
  } else {
    const simplePresets = Object.keys(presets);
    return Promise.resolve(simplePresets);
  }
}

module.exports = function (api) {
  api.registerAction('preset', presetsAction);
};