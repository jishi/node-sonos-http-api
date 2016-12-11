'use strict';
const path = require('path');
const requireDir = require('sonos-discovery/lib/helpers/require-dir');
const providers = [];

requireDir(path.join(__dirname, '../tts-providers'), (provider) => {
  providers.push(provider);
});

providers.push(require('../tts-providers/default/google'));

function tryDownloadTTS(phrase, language) {
  let path;
  return providers.reduce((promise, provider) => {
    return promise.then(() => {
      if (path) return path;
      return provider(phrase, language)
        .then((_path) => {
          path = _path;
          return path;
        });
      });
  }, Promise.resolve());
}

module.exports = tryDownloadTTS;