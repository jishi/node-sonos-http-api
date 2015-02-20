'use strict';

var requireFu = require('require-fu');

function HttpAPI(discovery, settings) {

  var port = settings.port;
  var webroot = settings.webroot;
  var actionsDir = __dirname + '/actions';
  var actions = {};

  this.getWebRoot = function () {
    return webroot;
  };

  this.getPort = function () {
    return port;
  };

  this.discovery = discovery;

  // this handles registering of all actions
  this.registerAction = function (action, handler) {
    actions[action] = handler;
  };

  //load modularized actions
  requireFu(actionsDir)(this);

  this.requestHandler = function (req, res) {
    var params = req.url.substring(1).split('/');

    var player = discovery.getPlayer(decodeURIComponent(params[0]));

    var opt = {};

    if (player) {
      opt.action = (params[1]||'').toLowerCase();
      opt.values = params.splice(2);
    } else {
      player = discovery.getAnyPlayer();
      opt.action = (params[0]||'').toLowerCase();
      opt.values = params.splice(1);
    }

    opt.player = player;
    handleAction(opt, function actionCallback(response) {
      if (response) {
        var jsonResponse = JSON.stringify(response);
        res.setHeader('Content-Length', Buffer.byteLength(jsonResponse));
        res.setHeader('Content-Type', 'application/json;charset=utf8');
        res.write(new Buffer(jsonResponse));
      }
      res.end();
    });
  };

  function handleAction(options, callback) {
    var player = options.player;

    if (!actions[options.action]) {
      return callback({error: 'action \'' + options.action + '\' not found'});
    }

    actions[options.action](player, options.values, callback);
    if (!callback.invokeIntended) {
      callback();
    }
  }

}

module.exports = HttpAPI;
