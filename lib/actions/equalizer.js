'use strict';

function nightMode(player, values) {
  let enable = values[0] === 'on';
  if(values[0] == "toggle") enable = !player.coordinator.state.equalizer.nightMode;
  return player.nightMode(enable).then((response) => {
    return { status: 'success', nightmode: enable };
  });
}

function speechEnhancement(player, values) {
  let enable = values[0] === 'on';
  if(values[0] == "toggle") enable = !player.coordinator.state.equalizer.speechEnhancement;
  return player.speechEnhancement(enable).then((response) => {
    return { status: 'success', speechenhancement: enable };
  });
}

function bass(player, values) {
  const level = parseInt(values[0]);
  return player.setBass(level);
}

function treble(player, values) {
  const level = parseInt(values[0]);
  return player.setTreble(level);
}

module.exports = function (api) {
  api.registerAction('nightmode', nightMode);
  api.registerAction('speechenhancement', speechEnhancement);
  api.registerAction('bass', bass);
  api.registerAction('treble', treble);
}
