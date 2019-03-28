'use strict';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const fileDuration = require('../helpers/file-duration');
const request = require('sonos-discovery/lib/helpers/request');
const logger = require('sonos-discovery/lib/helpers/logger');
const globalSettings = require('../../settings');
const XmlEntities = require('html-entities').XmlEntities;

const xmlEntities = new XmlEntities();

const APP_ID = '9aa44d9e6ec14da99231a9166fd50b0f';
const INSTANCE_ID = crypto.randomBytes(16).toString('hex');
const TOKEN_EXPIRATION = 590000; // 9:50 minutes in ms
const DEFAULT_SETTINGS = {
  name: 'ZiraRUS'
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
  const escapedText = xmlEntities.encodeNonUTF(text);
  return `<speak version='1.0' xml:lang='${lang}'><voice xml:lang='${lang}' xml:gender='${gender}' name='${name}'>${escapedText}</voice></speak>`;
}

function microsoft(phrase, voiceName) {
  if (!globalSettings.microsoft || !globalSettings.microsoft.key) {
    return Promise.resolve();
  }

  const settings = Object.assign({}, DEFAULT_SETTINGS, globalSettings.microsoft);

  if (voiceName) {
    settings.name = voiceName;
  }

  const phraseHash = crypto.createHash('sha1').update(phrase).digest('hex');
  const filename = `microsoft-${phraseHash}-${settings.name}.wav`;
  const filepath = path.resolve(globalSettings.webroot, 'tts', filename);

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

  let promise = Promise.resolve();
  if (bearerExpires < Date.now()) {
    // Refresh token
    promise = generateBearerToken(settings.key);
  }

  return promise.then(() => {
    const voice = VOICE[settings.name];
    if (!voice) {
      throw new Error(`Voice name ${settings.name} could not be located in the list of valid voice names`);
    }

    const ssml = format(voice.language, voice.gender, voice.font, phrase);
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
        'User-Agent': 'node-sonos-http-api',
        'Content-Length': ssml.length
      },
      body: ssml
    })
      .then(res => {
        return new Promise((resolve) => {

          const file = fs.createWriteStream(filepath);
          res.pipe(file);

          file.on('close', () => {
            resolve();
          })
        })

      })
      .then(() => {
        return fileDuration(filepath);
      })
      .then((duration) => {
        return {
          duration,
          uri: expectedUri
        };
      })
      .catch((err) => {
        logger.error(err);
        throw err;
      });
  });
}

const VOICE = {
  Hoda: { language: 'ar-EG', gender: 'Female', font: 'Microsoft Server Speech Text to Speech Voice (ar-EG, Hoda)' },
  Naayf: { language: 'ar-SA', gender: 'Male', font: 'Microsoft Server Speech Text to Speech Voice (ar-SA, Naayf)' },
  Ivan: { language: 'bg-BG', gender: 'Male', font: 'Microsoft Server Speech Text to Speech Voice (bg-BG, Ivan)' },
  HerenaRUS: { language: 'ca-ES', gender: 'Female', font: 'Microsoft Server Speech Text to Speech Voice (ca-ES, HerenaRUS)' },
  Jakub: { language: 'cs-CZ', gender: 'Male', font: 'Microsoft Server Speech Text to Speech Voice (cs-CZ, Jakub)' },
  Vit: { language: 'cs-CZ', gender: 'Male', font: 'Microsoft Server Speech Text to Speech Voice (cs-CZ, Vit)' },
  HelleRUS: { language: 'da-DK', gender: 'Female', font: 'Microsoft Server Speech Text to Speech Voice (da-DK, HelleRUS)' },
  Michael: { language: 'de-AT', gender: 'Male', font: 'Microsoft Server Speech Text to Speech Voice (de-AT, Michael)' },
  Karsten: { language: 'de-CH', gender: 'Male', font: 'Microsoft Server Speech Text to Speech Voice (de-CH, Karsten)' },
  Hedda: { language: 'de-DE', gender: 'Female', font: 'Microsoft Server Speech Text to Speech Voice (de-DE, Hedda)' },
  Stefan: {
    language: 'de-DE',
    gender: 'Male',
    font: 'Microsoft Server Speech Text to Speech Voice (de-DE, Stefan, Apollo)'
  },
  Catherine: {
    language: 'en-AU',
    gender: 'Female',
    font: 'Microsoft Server Speech Text to Speech Voice (en-AU, Catherine)'
  },
  Linda: { language: 'en-CA', gender: 'Female', font: 'Microsoft Server Speech Text to Speech Voice (en-CA, Linda)' },
  Susan: {
    language: 'en-GB',
    gender: 'Female',
    font: 'Microsoft Server Speech Text to Speech Voice (en-GB, Susan, Apollo)'
  },
  George: {
    language: 'en-GB',
    gender: 'Male',
    font: 'Microsoft Server Speech Text to Speech Voice (en-GB, George, Apollo)'
  },
  Ravi: {
    language: 'en-IN',
    gender: 'Male',
    font: 'Microsoft Server Speech Text to Speech Voice (en-IN, Ravi, Apollo)'
  },
  ZiraRUS: {
    language: 'en-US',
    gender: 'Female',
    font: 'Microsoft Server Speech Text to Speech Voice (en-US, ZiraRUS)'
  },
  BenjaminRUS: {
    language: 'en-US',
    gender: 'Male',
    font: 'Microsoft Server Speech Text to Speech Voice (en-US, BenjaminRUS)'
  },
  Laura: {
    language: 'es-ES',
    gender: 'Female',
    font: 'Microsoft Server Speech Text to Speech Voice (es-ES, Laura, Apollo)'
  },
  Pablo: {
    language: 'es-ES',
    gender: 'Male',
    font: 'Microsoft Server Speech Text to Speech Voice (es-ES, Pablo, Apollo)'
  },
  Raul: {
    language: 'es-MX',
    gender: 'Male',
    font: 'Microsoft Server Speech Text to Speech Voice (es-MX, Raul, Apollo)'
  },
  Caroline: {
    language: 'fr-CA',
    gender: 'Female',
    font: 'Microsoft Server Speech Text to Speech Voice (fr-CA, Caroline)'
  },
  Julie: {
    language: 'fr-FR',
    gender: 'Female',
    font: 'Microsoft Server Speech Text to Speech Voice (fr-FR, Julie, Apollo)'
  },
  Paul: {
    language: 'fr-FR',
    gender: 'Male',
    font: 'Microsoft Server Speech Text to Speech Voice (fr-FR, Paul, Apollo)'
  },
  Cosimo: {
    language: 'it-IT',
    gender: 'Male',
    font: 'Microsoft Server Speech Text to Speech Voice (it-IT, Cosimo, Apollo)'
  },
  Ayumi: {
    language: 'ja-JP',
    gender: 'Female',
    font: 'Microsoft Server Speech Text to Speech Voice (ja-JP, Ayumi, Apollo)'
  },
  Ichiro: {
    language: 'ja-JP',
    gender: 'Male',
    font: 'Microsoft Server Speech Text to Speech Voice (ja-JP, Ichiro, Apollo)'
  },
  Daniel: {
    language: 'pt-BR',
    gender: 'Male',
    font: 'Microsoft Server Speech Text to Speech Voice (pt-BR, Daniel, Apollo)'
  },
  Andrei: {
    language: 'ro-RO',
    gender: 'Male',
    font: 'Microsoft Server Speech Text to Speech Voice (ro-RO, Andrei)',
  },
  Irina: {
    language: 'ru-RU',
    gender: 'Female',
    font: 'Microsoft Server Speech Text to Speech Voice (ru-RU, Irina, Apollo)'
  },
  Pavel: {
    language: 'ru-RU',
    gender: 'Male',
    font: 'Microsoft Server Speech Text to Speech Voice (ru-RU, Pavel, Apollo)'
  },
  HuihuiRUS: {
    language: 'zh-CN',
    gender: 'Female',
    font: 'Microsoft Server Speech Text to Speech Voice (zh-CN, HuihuiRUS)'
  },
  Yaoyao: {
    language: 'zh-CN',
    gender: 'Female',
    font: 'Microsoft Server Speech Text to Speech Voice (zh-CN, Yaoyao, Apollo)'
  },
  Kangkang: {
    language: 'zh-CN',
    gender: 'Male',
    font: 'Microsoft Server Speech Text to Speech Voice (zh-CN, Kangkang, Apollo)'
  },
  Tracy: {
    language: 'zh-HK',
    gender: 'Female',
    font: 'Microsoft Server Speech Text to Speech Voice (zh-HK, Tracy, Apollo)'
  },
  Danny: {
    language: 'zh-HK',
    gender: 'Male',
    font: 'Microsoft Server Speech Text to Speech Voice (zh-HK, Danny, Apollo)'
  },
  Yating: {
    language: 'zh-TW',
    gender: 'Female',
    font: 'Microsoft Server Speech Text to Speech Voice (zh-TW, Yating, Apollo)'
  },
  Zhiwei: {
    language: 'zh-TW',
    gender: 'Male',
    font: 'Microsoft Server Speech Text to Speech Voice (zh-TW, Zhiwei, Apollo)'
  },
  JessaNeural: {
    language: 'en-US',
    gender: 'Female',
    font: 'Microsoft Server Speech Text to Speech Voice (en-US, JessaNeural)'
  }
};

module.exports = microsoft;
