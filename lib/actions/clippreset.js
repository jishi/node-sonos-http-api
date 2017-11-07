'use strict';
const path = require('path');
const settings = require('../../settings');
const presetAnnouncement = require('../helpers/preset-announcement');
const fileDuration = require('../helpers/file-duration');
const presets = require('../presets-loader');

let port;
const LOCAL_PATH_LOCATION = path.join(settings.webroot, 'clips');

function playClipOnPreset(player, values) {
  const presetName = decodeURIComponent(values[0]);
  const clipFileName = decodeURIComponent(values[1]);

  const preset = presets[presetName];

  if (!preset) {
    return Promise.reject(new Error(`No preset named ${presetName} could be found`));
  }

  return fileDuration(path.join(LOCAL_PATH_LOCATION, clipFileName))
    .then((duration) => {
      return presetAnnouncement(player.system, `http://${player.system.localEndpoint}:${port}/clips/${clipFileName}`, preset, duration);
    });
}

module.exports = function (api) {
  port = api.getPort();
  api.registerAction('clippreset', playClipOnPreset);
}
