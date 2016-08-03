const appleDef = {
  country:   '&country=',
  search:    {
               album:   'https://itunes.apple.com/search?media=music&limit=1&entity=album&attribute=albumTerm&term=',
               song:    'https://itunes.apple.com/search?media=music&limit=50&entity=song&term=',
               station: 'https://sticky-summer-lb.inkstone-clients.net/api/v1/searchMusic?limit=1&media=appleMusic&entity=station&term='
             },
  metastart: {
               album:   '0004206calbum%3a',
               song:    '00032020song%3a',
               station: '000c206cradio%3a'
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
  urimeta:   getURIandMetadata           
}  

function getURI(type, id) {
  if (type == 'album') {
    return `x-rincon-cpcontainer:0004206calbum%3a${id}`;
  } else 
  if (type == 'song') {
    return `x-sonos-http:song%3a${id}.mp4?sid=${sid}&flags=8224&sn=${accountSN}`;
  } else
  if (type == 'station') {
    return `x-sonosapi-radio:radio%3a${id}?sid=${sid}&flags=8300&sn=${accountSN}`;
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

function setService(p_sid, p_accountId, p_accountSN, p_country)
{
  sid = p_sid;
  serviceType = sid * 256 + 7;
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

  Id = (type=='album')?resList.results[0].collectionId:resList.results[0].id;
  Title = (type=='album')?resList.results[0].collectionName:resList.results[0].name;
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

