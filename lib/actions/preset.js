var fs = require('fs');
var presets = {};

function presetsAction(player, values, callback) {
  var value = decodeURIComponent(values[0]);
  if (value.startsWith('{'))
    var preset = JSON.parse(value);
  else
    var preset = presets[value];

  if (preset) {
    return player.system.applyPreset(preset);
  } else {
    var simplePresets = [];
    for (var key in presets) {
      if (presets.hasOwnProperty(key)) {
        simplePresets.push(key);
      }
    }
    return Promise.resolve(simplePresets);
  }
}

function initPresets(api) {
  var presetsFilename = __dirname + '/../../presets.json';
  fs.exists(presetsFilename, function (exists) {
    if (exists) {
      presets = require(presetsFilename);
      console.log('Presets:');
      console.dir(presets, { depth: null });
    } else {
      console.log('no preset file, ignoring...');
    }
    api.registerAction('preset', presetsAction);
  });
}

module.exports = function (api) {
  initPresets(api);
}