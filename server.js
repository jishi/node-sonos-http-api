var http = require('http');
var SonosDiscovery = require('sonos-discovery');
var SonosHttpAPI = require('./lib/sonos-http-api.js');
var fs = require('fs');
var path = require('path');

var settings = {
  port: 5005,
  cacheDir: './cache'
}

var discovery = new SonosDiscovery(settings);

try {
  var userSettings = require(path.resolve(__dirname, 'settings.json'));
} catch (e) {
  console.log('no settings file found, will only use default settings');
}

if (userSettings) {
  for (var i in userSettings) {
    settings[i] = userSettings[i];
  }
}

var presets = {};

fs.exists('./presets.json', function (exists) {
	if (exists) {
		presets = require('./presets.json');
		console.log('loaded presets', presets);
	} else {
		console.log('no preset file, ignoring...');
	}
	new SonosHttpAPI(discovery, settings, presets);
});

