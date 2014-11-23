'use strict';
var http = require('http');
var fs = require('fs');
var nodeStatic = new require('node-static');
var path = require('path');

function HttpAPI(discovery, settings, presets) {

  var lockVolumes = {};
  var pauseState = {};
  var saveState = {};
  var port = settings.port;
  var webroot = path.resolve(__dirname, "..", settings.cacheDir);

  // Create webroot + tts if not exist
  fs.mkdir(webroot, function (e) {
    if (e && e.code != 'EEXIST')
      console.error('creating cache dir failed!', e);
  });

  fs.mkdir(webroot + '/tts/', function (e) {
    if (e && e.code != 'EEXIST')
      console.error('creating cache dir failed!', e);
  });

  var fileServer = new nodeStatic.Server(webroot);

  var actions = {};

  this.getWebRoot = function () {
    return webroot;
  }

  this.getPort = function () {
    return port;
  }

  // this handles registering of all actions
  this.registerAction = function (action, handler) {
    actions[action] = handler;
  }


  var server = http.createServer(function (req, res) {

    req.addListener('end', function () {
        fileServer.serve(req, res, function (err, result) {
          // If error, route it.
          if (!err) return;

          if (req.method == 'GET') {
           var matched = GETRouting(req, res);
          }
        });
      }).resume();
  });

  function GETRouting(req, res) {
    var params = req.url.substring(1).split('/');

    var player = discovery.getPlayer(params[0]);

    var opt = {};

    if (player) {
      opt.action = params[1];
      opt.values = params.splice(2);
    } else {
      player = discovery.getAnyPlayer();
      opt.action = params[0];
      opt.values = params.splice(1);
    }

    opt.player = player;
    handleAction(opt, function actionCallback(response) {
      if (response) {
        var jsonResponse = JSON.stringify(response);
        res.setHeader('Content-Length', Buffer.byteLength(jsonResponse));
        res.write(new Buffer(jsonResponse));
      }
      res.end();
    });
  }


  function handleAction(options, callback) {
    console.log(options)
    var player = options.player;

    // modularized actions
    if (actions[options.action]) {
      actions[options.action](player, options.values, callback);

      if (!callback.invokeIntended)
        callback();
      return;
    }
    callback();

    return false;

  }

  server.listen(port);

  console.log("http server listening on port", port);
}

module.exports = HttpAPI;
