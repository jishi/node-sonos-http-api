'use strict';
const crypto = require('crypto');
const fs = require('fs');
const request = require('sonos-discovery/lib/helpers/request');
const logger = require('sonos-discovery/lib/helpers/logger');
const path = require('path');
const globalSettings = require('../../settings');

const APP_ID = '9aa44d9e6ec14da99231a9166fd50b0f';
const INSTANCE_ID = crypto.randomBytes(16).toString('hex');
const TOKEN_EXPIRATION = 590000; // 9:50 minutes in ms
const DEFAULT_SETTINGS = {
  language: 'en-US',
  gender: 'Female',
  name: 'Microsoft Server Speech Text to Speech Voice (en-US, ZiraRUS)'
};

let bearerToken;
let bearerExpires = Date.now();

function generateBearerToken(apiKey) {
  return request({
    uri: 'https://api.cognitive.microsoft.com/sts/v1.0/issueToken',
    method: 'POST',
    type: 'raw',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Content-Length': 0
    }
  })
    .then((body) => {
      logger.debug(`Bearer token: body`);
      bearerToken = body;
      bearerExpires = Date.now() + TOKEN_EXPIRATION;
    });
}

function format(lang, gender, name, text) {
  return `<speak version='1.0' xml:lang='en-us'><voice xml:lang='${lang}' xml:gender='${gender}' name='${name}'>${text}</voice></speak>`;
}

function microsoft(phrase, language) {
  if (!globalSettings.microsoft || !globalSettings.microsoft.key) {
    return Promise.resolve();
  }

  const settings = Object.assign({}, DEFAULT_SETTINGS, globalSettings.microsoft);

  const phraseHash = crypto.createHash('sha1').update(phrase).digest('hex');
  const filename =  `microsoft-${phraseHash}-${settings.language}-${settings.gender}.wav`;
  const filepath = path.resolve(globalSettings.webroot, 'tts', filename);

  const expectedUri = `/tts/${filename}`;
  try {
    fs.accessSync(filepath, fs.R_OK);
    return Promise.resolve(expectedUri);
  } catch (err) {
    logger.info(`announce file for phrase "${phrase}" does not seem to exist, downloading`);
  }

  let promise = Promise.resolve();
  if (bearerExpires < Date.now()) {
    // Refresh token
    promise = generateBearerToken(settings.key);
  }

  return promise.then(() => {
    const ssml = format(settings.language, settings.gender, settings.name, phrase);
    return request({
      uri: 'https://speech.platform.bing.com/synthesize',
      method: 'POST',
      type: 'stream',
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'riff-16khz-16bit-mono-pcm',
        'X-Search-AppId': APP_ID,
        'X-Search-ClientID': INSTANCE_ID,
        'User-Agent': 'node-sonos-http-api'
      },
      body: ssml
    })
      .then(res => {
        return new Promise((resolve) => {

          const file = fs.createWriteStream(filepath);
          res.pipe(file);

          res.on('end', () => {
            resolve(expectedUri);
          })
        })

      })
      .catch((err) => {
        logger.error(err);
        throw err;
      });
  });
}

module.exports = microsoft;