'use strict';
const appleDef = {
  country:   '&country=',
  search:    {
               album:   'https://itunes.apple.com/search?media=music&limit=1&entity=album&attribute=albumTerm&term=',
               song:    'https://itunes.apple.com/search?media=music&limit=50&entity=song&term=',
               station: 'https://itunes.apple.com/search?media=music&limit=50&entity=musicArtist&term='
             },
  metastart: {
               album:   '0004206calbum%3a',
               song:    '00032020song%3a',
               station: '000c206cradio%3ara.'
             },
  parent:    {
               album:   '00020000album:',
               song:    '00020000song:',
               station: '00020000radio:'
             },
  object:    {
               album:   'container.album.musicAlbum.#AlbumView',
               song:    'item.audioItem.musicTrack.#SongTitleWithArtistAndAlbum',
               station: 'item.audioItem.audioBroadcast'
             },
  
  service:   setService,
  term:      getSearchTerm,
  tracks:    loadTracks,
  empty:     isEmpty,
  metadata:  getMetadata,
  urimeta:   getURIandMetadata,
  headers:   getTokenHeaders,
  authenticate: authenticateService
}  

function getTokenHeaders() {
  return null;
};

function authenticateService() {
  return Promise.resolve();
}

function getURI(type, id) {
  if (type == 'album') {
    return `x-rincon-cpcontainer:0004206calbum%3a${id}`;
  } else 
  if (type == 'song') {
    return `x-sonos-http:song%3a${id}.mp4?sid=${sid}&flags=8224&sn=${accountSN}`;
  } else
  if (type == 'station') {
    return `x-sonosapi-radio:radio%3ara.${id}?sid=${sid}&flags=8300&sn=${accountSN}`;
  }
}

function getServiceToken() {
  return `SA_RINCON${serviceType}_X_#Svc${serviceType}-0-Token`;
}


var sid = '';
var serviceType = '';
var accountId = '';
var accountSN = '';
var country = '';

function setService(player, p_accountId, p_accountSN, p_country)
{
  sid = player.system.getServiceId('Apple Music');
  serviceType = player.system.getServiceType('Apple Music');
  accountId = p_accountId;
  accountSN = p_accountSN;
  country = p_country;
}

function getSearchTerm(type, term, artist, album, track) {
  var newTerm = artist;

  if ((newTerm != '') && ((artist != '') || (track != ''))) {
    newTerm += ' ';
  }
  newTerm += (type == 'album')?album:track;
  newTerm = encodeURIComponent(newTerm);
  if (artist != '') {
    newTerm += '&attribute=artistTerm';
  }
  if (track != '') {
    newTerm += '&attribute=songTerm';
  }
  
  return newTerm;
}

function getMetadata(type, id, name, title) {
  const token = getServiceToken();
  const parentUri = appleDef.parent[type] + name;
  const objectType = appleDef.object[type];
  
  if (type == 'station') {
    title = title + ' Radio';
  } else {
    title = '';
  }

  return `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/"
          xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
          <item id="${id}" parentID="${parentUri}" restricted="true"><dc:title>${title}</dc:title><upnp:class>object.${objectType}</upnp:class>
          <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">${token}</desc></item></DIDL-Lite>`;
}

function getURIandMetadata(type, resList)
{
  var Id = '';
  var Title = '';
  var Name = '';
  var MetadataID = '';
  var UaM = {
              uri: '',
              metadata: ''
            };

  if (type=='album') {
    Id = resList.results[0].collectionId;
    Title = resList.results[0].collectionName;
  } else
  if (type=='station') {
    Id = resList.results[0].artistId;
    Title = resList.results[0].artistName;
  } else {
    Id = resList.results[0].id;
    Title = resList.results[0].name;
  }
  Name = Title.toLowerCase().replace(' radio','').replace('radio ','').replace("'","&apos;");
  MetadataID = appleDef.metastart[type] + encodeURIComponent(Id);
    
  UaM.metadata = getMetadata(type, MetadataID, Name, Title);
  UaM.uri = getURI(type, encodeURIComponent(Id));
   
  return UaM;
}

function loadTracks(type, tracksJson) {
  var tracks = { count : 0,
                 isArtist : false,
                 queueTracks : []
                };

  if (tracksJson.resultCount > 0) {
    // Filtered list of tracks to play
    tracks.queueTracks = tracksJson.results.reduce(function(tracksArray, track) {
      if (track.isStreamable) {
        var skip = false;
  
        for (var j=0; (j < tracksArray.length) && !skip ; j++) {
          // Skip duplicate songs
          skip = (track.trackName == tracksArray[j].trackName);
        }
                    
        if (!skip) {
          var metadataID = appleDef.metastart['song'] + encodeURIComponent(track.trackId);
          var metadata = getMetadata('song', metadataID, track.trackId, track.trackName);
          var uri = getURI('song', encodeURIComponent(track.trackId));

          tracksArray.push({trackName:track.trackName, artistName:track.artistName, uri:uri, metadata:metadata});
          tracks.count++;
        }
      } 
      return tracksArray;
    }, []);
  }
  
  return tracks;
}

function isEmpty(type, resList)
{
  return (resList.resultCount == 0);
}

module.exports = appleDef;

