'use strict';
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const settings = require('../../settings');
const singlePlayerAnnouncement = require('../helpers/single-player-announcement');

let port;

const backupPresets = {};

function playClip(player, values) {
  const clipFileName = values[0];
  let announceVolume = settings.announceVolume || 40;

  if (/^\d+$/i.test(values[1])) {
    // first parameter is volume
    announceVolume = values[1];
  }

  return singlePlayerAnnouncement(player, `http://${player.system.localEndpoint}:${port}/clips/${clipFileName}`, announceVolume);
}

module.exports = function (api) {
  port = api.getPort();
  api.registerAction('clip', playClip);
}
