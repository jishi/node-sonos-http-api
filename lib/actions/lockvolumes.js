var lockVolumes = {};

function lockvolumes(player) {
  console.log("locking volumes");
  // Locate all volumes
  var system = player.system;

  for (var i in system.players) {
    var player = system.players[i];
    lockVolumes[i] = player.state.volume;
  }
  // prevent duplicates, will ignore if no event listener is here
  system.removeListener("volume", restrictVolume);
  system.on("volume", restrictVolume);
  return Promise.resolve();
}

function unlockvolumes(player) {
  console.log("unlocking volumes");
  var system = player.system;
  system.removeListener("volume", restrictVolume);
  return Promise.resolve();
}

function restrictVolume(info) {
  console.log("should revert volume to", lockVolumes[info.uuid]);
  var player = this.getPlayerByUUID(info.uuid);
  // Only do this if volume differs
  if (player.state.volume != lockVolumes[info.uuid])
    return player.setVolume(lockVolumes[info.uuid]);
}

module.exports = function (api) {
  api.registerAction('lockvolumes', lockvolumes);
  api.registerAction('unlockvolumes', unlockvolumes);
}