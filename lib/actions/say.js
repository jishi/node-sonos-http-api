'use strict';
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const tryDownloadTTS = require('../helpers/try-download-tts');
const singlePlayerAnnouncement = require('../helpers/single-player-announcement');
const settings = require('../../settings');

let port;
let system;

function say(player, values) {
  const text = values[0];
  let announceVolume;
  let language;

  if (/^\d+$/i.test(values[1])) {
    // first parameter is volume
    announceVolume = values[1];
    language = 'en-gb';
  } else {
    language = values[1] || 'en-gb';
    announceVolume = values[2] || settings.announceVolume || 40;
  }

  return tryDownloadTTS(text, language)
    .then((path) => {
      return singlePlayerAnnouncement(player, `http://${system.localEndpoint}:${port}${path}`, announceVolume);
    });
}

module.exports = function (api) {
  port = api.getPort();
  api.registerAction('say', say);

  system = api.discovery;
}
