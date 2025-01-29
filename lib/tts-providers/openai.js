'use strict';
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const https = require('https'); 
const path = require('path');
const fileDuration = require('../helpers/file-duration');
const settings = require('../../settings');
const logger = require('sonos-discovery/lib/helpers/logger');

function openai(phrase, language, voice = 'alloy', model = 'tts-1') {
    if (!language) {
        language = 'en';
    }

    // Construct a filesystem neutral filename
    const phraseHash = crypto.createHash('sha1').update(phrase).digest('hex');
    const filename = `openai-${phraseHash}-${language}.mp3`;
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
        logger.info(`announce file for phrase "${phrase}" does not seem to exist, downloading from OpenAI TTS`);
    }

    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            model: model,
            input: phrase,
            voice: voice
        });
        const options = {
            hostname: 'api.openai.com',
            path: '/v1/audio/speech',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.openaiKey}`,
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        };

        const req = https.request(options, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const file = fs.createWriteStream(filepath);
                res.pipe(file);
                file.on('finish', function () {
                    file.end();
                    resolve(expectedUri);
                });
            } else {
                reject(new Error(`Download from OpenAI TTS failed with status ${res.statusCode}, ${res.statusMessage}`));
            }
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.write(postData);
        req.end();
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

module.exports = openai;
