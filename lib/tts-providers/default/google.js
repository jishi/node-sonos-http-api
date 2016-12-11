'use strict';
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');
const settings = require('../../../settings');

function google(phrase, language) {
  if (!language) {
    language = 'en';
  }

  // Use Google tts translation service to create a mp3 file
  const ttsRequestUrl = 'http://translate.google.com/translate_tts?client=tw-ob&tl=' + language + '&q=' + encodeURIComponent(phrase);
  
  // Construct a filesystem neutral filename
  const phraseHash = crypto.createHash('sha1').update(phrase).digest('hex');
  const filename = `google-${phraseHash}-${language}.mp3`;
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
    var options = {"headers": {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36"}, "host": "translate.google.com", "path": "/translate_tts?client=tw-ob&tl=" + language + "&q=" + encodeURIComponent(phrase) }
    var callback = function (response) {
      if (response.statusCode < 300 && response.statusCode >= 200) {
        response.pipe(file);
        file.on('finish', function () {
          file.end();
          resolve(expectedUri);
        });
      } else {
        reject(new Error(`Download from google TTS failed with status ${response.statusCode}, ${response.message}`));
        
      }
    }
    
    http.request(options, callback).on('error', function (err) {
      fs.unlink(dest);
      reject(err);
    }).end();
  });
}

module.exports = google;