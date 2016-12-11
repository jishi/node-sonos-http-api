'use strict';
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');
const settings = require('../../settings');

function voicerss(phrase, language) {
  if (!settings.voicerss) {
    return Promise.resolve();
    
  }

  if (!language) {
    language = 'en-gb';
  }
  // Use voicerss tts translation service to create a mp3 file
  const ttsRequestUrl = `http://api.voicerss.org/?key=${settings.voicerss}&f=22khz_16bit_mono&hl=${language}&src=${encodeURIComponent(phrase)}`;
  
  // Construct a filesystem neutral filename
  const phraseHash = crypto.createHash('sha1').update(phrase).digest('hex');
  const filename = `voicerss-${phraseHash}-${language}.mp3`;
  const filepath = path.resolve(settings.webroot, 'tts', filename);
  
  const expectedUri = `/tts/${filename}`;
  try {
    fs.accessSync(filepath, fs.R_OK);
    return Promise.resolve(expectedUri);
  } catch (err) {
    console.log(`announce file for phrase "${phrase}" does not seem to exist, downloading`);
  }
  
  return new Promise((resolve, reject) => {
    var file = fs.createWriteStream(filepath);
    http.get(ttsRequestUrl, function (response) {
      if (response.statusCode < 300 && response.statusCode >= 200) {
        response.pipe(file);
        file.on('finish', function () {
          file.end();
          resolve(expectedUri);
        });
      } else {
        reject(new Error(`Download from voicerss failed with status ${response.statusCode}, ${response.message}`));
        
      }
    }).on('error', function (err) {
      fs.unlink(dest);
      reject(err);
    });
  });
}

module.exports = voicerss;