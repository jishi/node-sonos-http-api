var blacklist = [
  // { artist: 'Any song from this artist' },
  // { artist: 'Songs from this artist', album: 'Only from this album' },
  // { album: 'Any song from an album named like this - no matter the artist' },
  // { title: 'This track title - no matter album or artist' },
  // { title: 'This song', artist: 'Only if from this artist' }
]

var ruleApplies = function(rule, track) {
  for(key in rule) {
    if(track[key] != rule[key]) {
      return false;
    }
  }
  return true;
}

var isBlacklisted = function(track) {
  for(ruleIndex in blacklist) {
    var rule = blacklist[ruleIndex];
    if(ruleApplies(rule, track)) {
      console.log("Current track " + JSON.stringify(track) + " matches blaclisted rule " + JSON.stringify(rule));
      return true;
    }
  }
}

module.exports = function(_discovery) {
  return function(player) {
    var discovery = _discovery;
    if(isBlacklisted(player.state.currentTrack)) {
      discovery.getPlayerByUUID(player.coordinator).nextTrack();
    }
  }
}
