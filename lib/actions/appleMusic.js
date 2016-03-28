var metadataTemplate = '<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" ' +
        'xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">' +
        '<item id="{metadataID}" parentID="{parentURI}" restricted="true"><upnp:class>object.item.audioItem.{clazz}</upnp:class>' +
        '<desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON52231_X_#Svc52231-0-Token</desc></item></DIDL-Lite>';

var uriTemplates = {
  song: 'x-sonos-http:{id}.mp4?sid=204&flags=8224&sn=4',
  album: 'x-rincon-cpcontainer:0004206c{id}'
};

var CLASSES = {
  song: 'musicTrack',
  album: 'musicAlbum'
}

var METADATA_URI_STARTERS = {
  song: '00032020',
  album: '0004206c'
};

var PARENTS = {
  song: '0004206calbum%3a',
  album: '00020000album%3a'
};


function appleMusic(player, values) {
  var action = values[0];
  var trackID = values[1];
  var type = trackID.split(':')[0];
  var metadataID = METADATA_URI_STARTERS[type] + encodeURIComponent(trackID);

  var metadata = metadataTemplate.format({
    metadataID: metadataID,
    parentURI: PARENTS[type],
    clazz: CLASSES[type]
  });
  
  var uri = uriTemplates[type].format({id: encodeURIComponent(trackID)});

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