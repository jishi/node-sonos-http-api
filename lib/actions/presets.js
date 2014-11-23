function presets(player, values) {
  var value = decodeURIComponent(values[0]);
  if (value.startsWith('{'))
    var preset = JSON.parse(value);
  else
    var preset = presets[value];

  console.log("applying preset", preset)

  if (preset)
    player.discovery.applyPreset(preset);
}

module.exports = function (api) {
  api.registerAction('presets', presets);
}