'use strict';
const fs = require('fs');
const path = require('path');

const webroot = path.resolve(__dirname + '/../../static');

let settings = {};
try {
  settings = require.main.require('./settings.json');
} catch (e) {
  console.error(e);
}

function tryStaticTTS(phrase) {
  if (!phrase.startWith("static_tts_")) {
    reject(new Error('All local TTS requests must begin with "tts_".'));
  }

  phrase = phrase.replace(/^static_tts_/,'');

  const filename = settings.staticTTS.phrases[phrase];
  const filepath = path.resolve(webroot, 'static_tts', filename);

  const expectedUri = `/static_tts/${filename}`;
  try {
    fs.accessSync(filepath, fs.R_OK);
    return Promise.resolve(expectedUri);
  } catch (err) {
    reject(new Error(`static file for phrase "${phrase}" does not seem to exist.`));
  }
}

module.exports = tryStaticTTS;