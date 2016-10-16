'use strict';
const path = require('path');
const tryDownloadTTS = require('../helpers/try-download-tts');
const allPlayerAnnouncement = require('../helpers/all-player-announcement');
let port;
let system;

let settings = {};

try {
  settings = require.main.require('./settings.json');
} catch (e) {}

function sayAll(player, values) {
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
    .then(uri => {
      return allPlayerAnnouncement(player.system, `http://${player.system.localEndpoint}:${port}${uri}`, announceVolume);
    })  

}

module.exports = function (api) {
  port = api.getPort();
  api.registerAction('sayall', sayAll);
};