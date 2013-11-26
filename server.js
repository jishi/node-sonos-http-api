var http = require('http');
var SonosDiscovery = require('sonos-discovery');
var SonosHttpAPI = require('./lib/sonos-http-api.js');
var fs = require('fs');
var discovery = new SonosDiscovery();
var port = 5005;

var presets = {};

fs.exists('./presets.json', function (exists) {
	if (exists) {
		presets = require('./presets.json');
		console.log('loaded presets', presets);
	} else {
		console.log('no preset file, ignoring...');
	}
	new SonosHttpAPI(discovery, port, presets);
});

