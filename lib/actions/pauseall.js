var pauseState = {};

function pauseAll(player, values) {
  console.log("pausing all players");
  // save state for resume

  if (values[0] && values[0] > 0) {
    console.log("in", values[0], "minutes");
    setTimeout(function () { doPauseAll(player.discovery); }, values[0]*1000*60);
  } else {
    doPauseAll(player.discovery);
  }
}

function resumeAll(player, values) {
  console.log("resuming all players");

    if (values[0] && values[0] > 0) {
    console.log("in", values[0], "minutes");
    setTimeout(function () { doResumeAll(player.discovery); }, values[0]*1000*60);
  } else {
    doResumeAll(player.discovery);
  }
}

function doPauseAll(discovery) {
  pauseState = {};
  discovery.getZones().forEach(function (zone) {
    pauseState[zone.uuid] = zone.coordinator.state.zoneState;
    if (pauseState[zone.uuid] == "PLAYING") {
      var player = discovery.getPlayerByUUID(zone.uuid);
      player.pause();
    }
  });
}

function doResumeAll(discovery) {
  for (var uuid in pauseState) {
    if (pauseState[uuid] == "PLAYING") {
      var player = discovery.getPlayerByUUID(uuid);
      player.play();
    }
  }

  // Clear the pauseState to prevent a second resume to raise hell
  pauseState = {};
}



module.exports = function (api) {
  api.registerAction('pauseall', pauseAll);
  api.registerAction('resumeall', resumeAll);
}