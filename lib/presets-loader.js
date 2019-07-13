'use strict';
const fs = require('fs');
const util = require('util');
const path = require('path');
const logger = require('sonos-discovery/lib/helpers/logger');
const tryLoadJson = require('./helpers/try-load-json');
const settings = require('../settings');

const PRESETS_PATH = settings.presetDir;
const PRESETS_FILENAME = `${__dirname}/../presets.json`;
const presets = {};

function readPresetsFromDir(presets, presetPath) {
  let files;
  try {
    files = fs.readdirSync(presetPath);
  } catch (e) {
    logger.warn(`Could not find dir ${presetPath}, are you sure it exists?`);
    logger.warn(e.message);
    return;
  }

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
    const preset = tryLoadJson(file.fullPath);
    if (Object.keys(preset).length === 0) {
      logger.warn(`could not parse preset file ${file.name}, please make sure syntax conforms with JSON5.`);
      return;
    }

    presets[presetName] = preset;
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
  Object.keys(presets).forEach(presetName => {
    delete presets[presetName];
  });
  readPresetsFromFile(presets, PRESETS_FILENAME);
  readPresetsFromDir(presets, PRESETS_PATH);

  logger.info('Presets loaded:', util.inspect(presets, { depth: null }));

}

initPresets();
let watchTimeout;
try {
  fs.watch(PRESETS_PATH, { persistent: false }, () => {
    clearTimeout(watchTimeout);
    watchTimeout = setTimeout(initPresets, 200);
  });
} catch (e) {
  logger.warn(`Could not start watching dir ${PRESETS_PATH}, will not auto reload any presets. Make sure the dir exists`);
  logger.warn(e.message);
}

module.exports = presets;
