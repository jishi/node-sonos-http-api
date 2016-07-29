
function getMetadata(id, parentUri, type, title) {
  return `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/"
  xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
  <item id="${id}" parentID="${parentUri}" restricted="true"><dc:title>"${title}"</dc:title><upnp:class>object.item.audioItem.${type}</upnp:class>
  <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON52231_X_#Svc52231-0-Token</desc></item></DIDL-Lite>`;
}

function getSongUri(id) {
  return `x-sonos-http:${id}.mp4?sid=204&flags=8224&sn=4`;
}

function getAlbumUri(id) {
  return `x-rincon-cpcontainer:0004206c${id}`;
}

const uriTemplates = {
  song: getSongUri,
  album: getAlbumUri
};

const CLASSES = {
  song: 'musicTrack',
  album: 'musicAlbum'
};

const METADATA_URI_STARTERS = {
  song: '00032020',
  album: '0004206c'
};

const PARENTS = {
  song: '0004206calbum%3a',
  album: '00020000album%3a'
};

function appleMusic(player, values) {
  const action = values[0];
  const trackID = values[1];
  const type = trackID.split(':')[0];
  var nextTrackNo = 0;

  const metadataID = METADATA_URI_STARTERS[type] + encodeURIComponent(trackID);
  const metadata = getMetadata(metadataID, PARENTS[type], CLASSES[type], '');
  const uri = uriTemplates[type](encodeURIComponent(trackID));

  if (action == 'queue') {
    return player.coordinator.addURIToQueue(uri, metadata);
  } else if (action == 'now') {
    nextTrackNo = player.coordinator.state.trackNo + 1;
    return player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo)
      .then(() => player.coordinator.nextTrack())
      .then(() => player.coordinator.play());
  } else if (action == 'next') {
    nextTrackNo = player.coordinator.state.trackNo + 1;
    return player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo);
  }
}

module.exports = function (api) {
  api.registerAction('applemusic', appleMusic);
};
