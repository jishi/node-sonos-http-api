'use strict';

var http = require('http');
var https = require('https');
var SonosDiscovery = require('sonos-discovery');
var SonosHttpAPI = require('./lib/sonos-http-api.js');
var nodeStatic = require('node-static');
var fs = require('fs');
var path = require('path');
var webroot = path.resolve(__dirname, 'static');
var auth = require('basic-auth');

var settings = {
  port: 5005,
  cacheDir: './cache',
  webroot: webroot,
  ssl: false,
  auth: false,
  name: 'user',
  pass: 'pass'
};

// Create webroot + tts if not exist
if (!fs.existsSync(webroot)) {
  fs.mkdirSync(webroot);
}
if (!fs.existsSync(webroot + '/tts/')) {
  fs.mkdirSync(webroot + '/tts/');
}

// load user settings
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

var options = {}

if (settings.ssl) {
  console.log('using SSL');
  options = {
    key: fs.readFileSync(path.resolve(__dirname, 'key.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, 'cert.pem'))
  };
}

if (settings.auth) {
  console.log('requires authorization');
}

var fileServer = new nodeStatic.Server(webroot);
var discovery = new SonosDiscovery(settings);
var api = new SonosHttpAPI(discovery, settings);

var requestListener = function (req, res) {
	
  if (settings.auth) {	
    var credentials = auth(req)
 
    if (!credentials || credentials.name !== settings.name || credentials.pass !== settings.pass) {
      res.statusCode = 401
      res.setHeader('WWW-Authenticate', 'Basic realm="example"')
      res.end('Access denied')
      return
    }
  }

  req.addListener('end', function () {
    fileServer.serve(req, res, function (err) {
      // If error, route it.
      if (!err) {
        return;
      }

      if (req.method === 'GET') {
        api.requestHandler(req, res);
      }
    });
  }).resume();
}

var server = (settings.ssl ? https.createServer(options, requestListener) : http.createServer(requestListener));

server.listen(settings.port, function () {
  console.log('http server listening on port', settings.port);
});
