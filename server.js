'use strict';

var http = require('http');
var https = require('https');
var auth = require('basic-auth');
var SonosDiscovery = require('sonos-discovery');
var SonosHttpAPI = require('./lib/sonos-http-api.js');
var nodeStatic = require('node-static');
var fs = require('fs');
var path = require('path');
var webroot = path.resolve(__dirname, 'static');

var settings = {
  port: 5005,
  securePort: 5006,
  cacheDir: './cache',
  webroot: webroot
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

var fileServer = new nodeStatic.Server(webroot);
var discovery = new SonosDiscovery(settings);
var api = new SonosHttpAPI(discovery, settings);

var requestHandler = function (req, res) {
  req.addListener('end', function () {
    fileServer.serve(req, res, function (err) {

      if (settings.auth) {
        var credentials = auth(req);

        if (!credentials || credentials.name !== settings.auth.username || credentials.pass !== settings.auth.password) {
          res.statusCode = 401;
          res.setHeader('WWW-Authenticate', 'Basic realm="Access Denied"');
          res.end('Access denied');
          return;
        }
      }

      // If error, route it.
      if (!err) {
        return;
      }

      if (req.method === 'GET') {
        api.requestHandler(req, res);
      }
    });
  }).resume();
};

var server;

if (settings.https) {
  var options = {};
  if (settings.https.pfx)
    options.pfx = fs.readFileSync(settings.https.pfx);
  else if (settings.https.key && settings.https.cert) {
    options.key = fs.readFileSync(settings.https.key);
    options.cert = fs.readFileSync(settings.https.cert);
  } else {
    console.error("Insufficient configuration for https");
    return;
  }

  var secureServer = https.createServer(options, requestHandler);
  secureServer.listen(settings.securePort, function () {
    console.log('https server listening on port', settings.securePort);
  });
}

server = http.createServer(requestHandler);

server.listen(settings.port, function () {
  console.log('http server listening on port', settings.port);
});


