'use strict';
const path = require('path');
const fileDuration = require('../helpers/file-duration');
const settings = require('../../settings');
const singlePlayerAnnouncement = require('../helpers/single-player-announcement');

let port;

const LOCAL_PATH_LOCATION = path.join(settings.webroot, 'clips');

const backupPresets = {};

function playClip(player, values) {
  const clipFileName = values[0];
  let announceVolume = settings.announceVolume || 40;

  if (/^\d+$/i.test(values[1])) {
    // first parameter is volume
    announceVolume = values[1];
  }

  return fileDuration(path.join(LOCAL_PATH_LOCATION, clipFileName))
      .then((duration) => {
        return singlePlayerAnnouncement(player, `http://${player.system.localEndpoint}:${port}/clips/${clipFileName}`, announceVolume, duration);
      });
}

module.exports = function(api) {
  port = api.getPort();
  api.registerAction('clip', playClip);
}
