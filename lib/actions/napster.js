'use strict';
function getMetadata(id, parentUri, type, title, cdudn) {
  return `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/"
  xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
  <item id="${id}" parentID="${parentUri}" restricted="true"><dc:title>"${title}"</dc:title><upnp:class>${type}</upnp:class>
  <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">${cdudn}</desc></item></DIDL-Lite>`;
}

function getSongUri(id) {
  return `x-sonos-http:song%3a${id}.mp4?sid=204&flags=8224&sn=5`;
}

function getAlbumUri(id) {
  return `x-rincon-cpcontainer:100420ecexplore%3aalbum%3a%3aAlb.${id}`;
}



const uriTemplates = {
  song: getSongUri,
  album: getAlbumUri
};

const CLASSES = {
  song: 'object.item.audioItem.musicTrack',
  album: 'object.container.album.musicAlbum'
};

const METADATA_URI_STARTERS = {
  song: '10032020song%3a',
  album: '100420ec'
};

const PARENTS = {
  song: '1004206calbum%3a',
  album: '100420ecexplore%3aalbum%3a%3a'
};

const CDUDN = {
  song: 'SA_RINCON52231_X_#Svc52231-0-Token',
  album: 'SA_RINCON55303_X_#Svc55303-0-Token'
};

function napster(player, values) {
  const action = values[0];
  const trackID = values[1].split(':')[1];
  const type = values[1].split(':')[0];
  var nextTrackNo = 0;

  const metadataID = METADATA_URI_STARTERS[type] + encodeURIComponent(trackID);
  const metadata = getMetadata(metadataID, PARENTS[type], CLASSES[type], '', CDUDN[type]);
  const uri = uriTemplates[type](encodeURIComponent(trackID));

  if (action == 'queue') {
    return player.coordinator.addURIToQueue(uri, metadata);
  } else if (action == 'now') {
    nextTrackNo = player.coordinator.state.trackNo + 1;
    let promise = Promise.resolve();
    if (player.coordinator.avTransportUri.startsWith('x-rincon-queue') === false) {
      promise = promise.then(() => player.coordinator.setAVTransport(`x-rincon-queue:${player.coordinator.uuid}#0`));
    }

    return promise.then(() => {
      return player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo)
        .then((addToQueueStatus) => player.coordinator.trackSeek(addToQueueStatus.firsttracknumberenqueued))
        .then(() => player.coordinator.play());
    });
  } else if (action == 'next') {
    nextTrackNo = player.coordinator.state.trackNo + 1;
    return player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo);
  }
}

module.exports = function (api) {
  api.registerAction('napster', napster);
};
