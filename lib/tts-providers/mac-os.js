'use strict';
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');
const fileDuration = require('../helpers/file-duration');
const settings = require('../../settings');
const logger = require('sonos-discovery/lib/helpers/logger');
var exec = require('child_process').exec;

function macSay(phrase, voice) {
  if (!settings.macSay) {
    return Promise.resolve();
  }

  var selectedRate = settings.macSay.rate;
  if( !selectedRate ) {
    selectedRate = "default";
  }
  var selectedVoice = settings.macSay.voice;
  if( voice ) {
    selectedVoice = voice;
  }

  // Construct a filesystem neutral filename
  const phraseHash = crypto.createHash('sha1').update(phrase).digest('hex');
  const filename = `macSay-${phraseHash}-${selectedRate}-${selectedVoice}.m4a`;
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
    //
    // For more information on the "say" command, type "man say" in Terminal
    // or go to
    // https://developer.apple.com/legacy/library/documentation/Darwin/Reference/ManPages/man1/say.1.html
    //
    // The list of available voices can be configured in
    // System Preferences -> Accessibility -> Speech -> System Voice
    //

    var execCommand = `say "${phrase}" -o ${filepath} --data-format=aac`;
    if( selectedVoice && selectedRate != "default" ) {
      execCommand = `say -r ${selectedRate} -v ${selectedVoice} "${phrase}" -o ${filepath} --data-format=aac`;
    } else if ( selectedVoice ) {
      execCommand = `say -v ${selectedVoice} "${phrase}" -o ${filepath} --data-format=aac`;
    } else if ( selectedRate  != "default" ) {
      execCommand = `say -r ${selectedRate} "${phrase}" -o ${filepath} --data-format=aac`;
    }

    exec(execCommand,
      function (error, stdout, stderr) {
        if (error !== null) {
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

module.exports = macSay;
