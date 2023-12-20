'use strict';
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');
const ElevenLabs = require("elevenlabs-node");
const fileDuration = require('../helpers/file-duration');
const settings = require('../../settings');
const logger = require('sonos-discovery/lib/helpers/logger');

const DEFAULT_SETTINGS = {
  stability: 0.5,
  similarityBoost: 0.5,
  speakerBoost: true,
  style: 1,
};

// Provider developed based on structure from aws-polly.js.
// In this tts provider language argument from uri is used to inject custom voiceId
function eleven(phrase, voiceId) {
  if (!settings.elevenlabs) {
    return Promise.resolve();
  }

  // Construct a filesystem neutral filename
  const dynamicParameters = { textInput: phrase };
  const synthesizeParameters = Object.assign({}, DEFAULT_SETTINGS, dynamicParameters);

  if (settings.elevenlabs.stability) {
    synthesizeParameters.stability = settings.elevenlabs.stability;
  }
  if (settings.elevenlabs.similarityBoost) {
    synthesizeParameters.similarityBoost = settings.elevenlabs.similarityBoost;
  }
  if (settings.elevenlabs.modelId) {
    synthesizeParameters.modelId = settings.elevenlabs.modelId;
  }
  if (settings.elevenlabs.style) {
    synthesizeParameters.style = settings.elevenlabs.style;
  }
  if (settings.elevenlabs.speakerBoost) {
    synthesizeParameters.speakerBoost = settings.elevenlabs.speakerBoost;
  }

  let targetVoiceId;
  if (voiceId) {
    targetVoiceId = voiceId;
  }
  else if (settings.elevenlabs.voiceId) {
    targetVoiceId = settings.elevenlabs.voiceId;
  }
  else {
    console.log('Voice ID not provided neither as language nor in settings.')
    return Promise.resolve();
  }

  const phraseHash = crypto.createHash('sha1').update(phrase).digest('hex');
  const filename = `elevenlabs-${phraseHash}-${targetVoiceId}.mp3`;
  const filepath = path.resolve(settings.webroot, 'tts', filename);

  synthesizeParameters.fileName = filepath;

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

  const voice = new ElevenLabs(
      {
          apiKey:  settings.elevenlabs.apiKey,              // Your API key from Elevenlabs
          voiceId: targetVoiceId,                           // A Voice ID from Elevenlabs
      }
  );

  return voice.textToSpeech(synthesizeParameters)
    .then((res) => {
      console.log('Elevenlabs TTS generated new audio file.');
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

module.exports = eleven;
