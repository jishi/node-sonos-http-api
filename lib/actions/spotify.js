var metadataTemplate = '<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" ' +
        'xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">' +
        '<item id="00030020{uri}" restricted="true"><upnp:class>object.item.audioItem.musicTrack</upnp:class>' +
        '<desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON2311_X_#Svc2311-0-Token</desc></item></DIDL-Lite>';

function spotify(player, values) {
  var action = values[0];
  var encodedSpotifyUri = encodeURIComponent(values[1]);

  var uri = 'x-sonos-spotify:' + encodedSpotifyUri + '?sid=9&flags=32&sn=1';

  var metadata = metadataTemplate.format({uri: encodedSpotifyUri});

  if (action == 'queue') {
    return player.coordinator.addURIToQueue(uri, metadata);
  } else if(action == 'now') {
    var nextTrackNo = player.coordinator.state.trackNo + 1;
    return player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo)
      .then(() => player.coordinator.nextTrack())
      .then(() => player.coordinator.play())
  } else if (action == 'next') {
    var nextTrackNo = player.coordinator.state.trackNo + 1;
    return player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo);
  }
}

module.exports = function (api) {
  api.registerAction('spotify', spotify);
}