'use strict';
const tryDownloadTTS = require('../helpers/try-download-tts');
const allPlayerAnnouncement = require('../helpers/all-player-announcement');
const settings = require('../../settings');

let port;
let system;

function sayAll(player, values) {
  let text;
  try {
    text = decodeURIComponent(values[0]);
  } catch (err) {
    if (err instanceof URIError) {
      err.message = `The encoded phrase ${values[0]} could not be URI decoded. Make sure your url encoded values (%xx) are within valid ranges. xx should be hexadecimal representations`;
    }
    return Promise.reject(err);
  }
  let announceVolume;
  let language;

  if (/^\d+$/i.test(values[1])) {
    // first parameter is volume
    announceVolume = values[1];
    // language = 'en-gb';
  } else {
    language = values[1];
    announceVolume = values[2] || settings.announceVolume || 40;
  }


  return tryDownloadTTS(text, language)
    .then((result) => {
      return allPlayerAnnouncement(player.system, `http://${player.system.localEndpoint}:${port}${result.uri}`, announceVolume, result.duration);
    })  

}

module.exports = function (api) {
  port = api.getPort();
  api.registerAction('sayall', sayAll);
};
