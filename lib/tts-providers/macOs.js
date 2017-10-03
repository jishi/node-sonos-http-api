'use strict';
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');
const fileDuration = require('../helpers/file-duration');
const settings = require('../../settings');
const logger = require('sonos-discovery/lib/helpers/logger');
var exec = require('child_process').exec;

function mac_os_say(phrase, voice) {
  if (!voice) {
    voice = 'Alex';
  }

  // Construct a filesystem neutral filename
  const phraseHash = crypto.createHash('sha1').update(phrase).digest('hex');
  const filename = `macOS-${phraseHash}-${voice}.m4a`;
  const filepath = path.resolve(settings.webroot, 'tts', filename);

  const expectedUri = `/tts/${filename}`;
 
  try {
    fs.accessSync(filepath, fs.R_OK);
    return fileDuration(filepath)
      .then((duration) => {
        return {
          duration,
          uri: expectedUri
        };
      });
  } catch (err) {
    logger.info(`announce file for phrase "${phrase}" does not seem to exist, downloading`);
  }

 return new Promise((resolve, reject) => {
    exec('say -v ' + voice + ' "' + phrase + '" -o ' + filepath,
      function (error, stdout, stderr) {
        // console.log('say stdout: ' + stdout);
        // console.log('say stderr: ' + stderr);
        
        if (error !== null) {
          // console.log('exec error: ' + error);
          reject(error);
        } else {
          resolve(expectedUri);
        }
      });

    })
    .then(() => {
      return fileDuration(filepath);
    })
    .then((duration) => {
      return {
        duration,
        uri: expectedUri
      };
    });
}

module.exports = mac_os_say;
