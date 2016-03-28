var metadataTemplate = '<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" ' +
        'xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">' +
        '<item id="00032020{uri}" parentID="0004206calbum%3a" restricted="true"><upnp:class>object.item.audioItem.musicTrack</upnp:class>' +
        '<desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON52231_X_#Svc52231-0-Token</desc></item></DIDL-Lite>';

function appleMusic(player, values) {
  var action = values[0];
  var trackID = values[1];
  var appleMusicURI = 'song%3a' + trackID;
  var uri = 'x-sonos-http:' + appleMusicURI + '.mp4?sid=204&flags=8224&sn=4';

  var metadata = metadataTemplate.format({uri: appleMusicURI});

  if (action == 'queue') {
    player.coordinator.addURIToQueue(uri, metadata);
  } else if(action == 'now') {

    var nextTrackNo = player.coordinator.state.trackNo + 1;
    player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo, function (error, res) {
      if (!error) {
        player.coordinator.nextTrack(function (error) {
          if (!error) {
            player.coordinator.play();
          }
        });
      }
    });
  } else if (action == 'next') {
    var nextTrackNo = player.coordinator.state.trackNo + 1;
    player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo);
  }
}

module.exports = function (api) {
  api.registerAction('applemusic', appleMusic);
}