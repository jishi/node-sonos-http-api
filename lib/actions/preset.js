'use strict';
const fs = require('fs');
const util = require('util');
const path = require('path');
const logger = require('sonos-discovery/lib/helpers/logger');
const presetsFilename = __dirname + '/../../presets.json';
const presetsPath = __dirname + '/../../presets/';
let presets = {};

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

function readPresetsFromDir(presets, presetPath) {
  let files = fs.readdirSync(presetPath);

  files.map((name) => {
    let fullPath = path.join(presetPath, name);
    return {
      name,
      fullPath,
      stat: fs.statSync(fullPath)
    };
  }).filter((file) => {
    return !file.stat.isDirectory() && !file.name.startsWith('.') && file.name.endsWith('.json');
  }).forEach((file) => {
    const presetName = file.name.replace(/\.json/i, '');
    try {
      presets[presetName] = JSON.parse(fs.readFileSync(file.fullPath));
    } catch (err) {
      logger.warn(`could not parse preset file ${file.name} ("${err.message}"), please validate it with a JSON parser.`);
    }
  });
}

function readPresetsFromFile(presets, filename) {
  try {
    const presetStat = fs.statSync(filename);
    if (!presetStat.isFile()) {
      return;
    }

    const filePresets = require(filename);
    Object.keys(filePresets).forEach(presetName => {
      presets[presetName] = filePresets[presetName];
    });

    logger.warn('You are using a presets.json file! ' +
      'Consider migrating your presets into the presets/ ' +
      'folder instead, and enjoy auto-reloading of presets when you change them');
  } catch (err) {
    logger.debug(`no presets.json file exists, skipping`);
  }
}

function initPresets() {
  presets = {};
  readPresetsFromFile(presets, presetsFilename);
  readPresetsFromDir(presets, presetsPath);

  logger.info('Presets loaded:', util.inspect(presets, { depth: null }));

}

module.exports = function (api) {
  let watchTimeout;
  initPresets();
  fs.watch(presetsPath, { persistent: false }, () => {
    clearTimeout(watchTimeout);
    watchTimeout = setTimeout(initPresets, 200);
  });
  api.registerAction('preset', presetsAction);
}