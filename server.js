var http = require('http');
var SonosDiscovery = require('sonos-discovery');
var SonosHttpAPI = require('./lib/sonos-http-api.js');
var fs = require('fs');
var discovery = new SonosDiscovery();
var path = require('path');

var config = require('./config.json');
var port = config.my_port;
var ip = config.my_ip_address;

var webroot = path.join(path.dirname(__filename), 'sonos');
var presets = {};

fs.exists('./presets.json', function (exists) {
	if (exists) {
		presets = require('./presets.json');
		console.log('loaded presets', presets);
	} else {
		console.log('no preset file, ignoring...');
	}
	new SonosHttpAPI(discovery, port, presets, ip, webroot);
});

