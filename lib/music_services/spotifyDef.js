const spotifyDef = {
  country:   '&market=',
  search:    {
               album:   'https://api.spotify.com/v1/search?type=album&limit=1&q=album:',
               song:    'https://api.spotify.com/v1/search?type=track&limit=50&q=',
               station: 'https://api.spotify.com/v1/search?type=artist&limit=1&q='
             },
  metastart: {
               album:   '0004206cspotify%3aalbum%3a',
               song:    '00032020spotify%3atrack%3a',
               station: '000c206cspotify:artistRadio%3a'
             },
  parent:    {
               album:   '00020000album:',
               song:    '00020000track:',
               station: '00052064spotify%3aartist%3a'
             },
  object:    {
               album:   'container.album.musicAlbum',
               song:    'item.audioItem.musicTrack',
               station: 'item.audioItem.audioBroadcast.#artistRadio'
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
    return `x-rincon-cpcontainer:0004206c${id}`;
  } else 
  if (type == 'song') {
    return `x-sonos-spotify:spotify%3atrack%3a${id}?sid=${sid}&flags=8224&sn=${accountSN}`;
  } else
  if (type == 'station') {
    return `x-sonosapi-radio:spotify%3aartistRadio%3a${id}?sid=${sid}&flags=8300&sn=${accountSN}`;
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
  var newTerm = '';

  if (album != '') {
    newTerm = album + ' ';
  }
  if (artist != '') {
    newTerm += 'artist:' + artist + ((track != '')?' ':'');
  }
  if (track != '') {
    newTerm += 'track:' + track;
  }
  newTerm = encodeURIComponent(newTerm);
  
  return newTerm;
}
  
function getMetadata(type, id, name, title) {
  const token = getServiceToken();
  const parentUri = spotifyDef.parent[type] + name;
  const objectType = spotifyDef.object[type];
  
  if (type != 'station') {
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

  var items = [];
    
  if (type == 'album') {
    items = resList.albums.items;
  } else
  if (type == 'station') {
    items = resList.artists.items;
  }
    
  Id = items[0].id;
  Title = items[0].name + ((type=='station')?' Radio':'');
  Name = Title.toLowerCase().replace(' radio','').replace('radio ','');
  MetadataID = spotifyDef.metastart[type] + encodeURIComponent(Id);
    
  UaM.metadata = getMetadata(type, MetadataID, (type=='album')?Title.toLowerCase():Id, Title);
  UaM.uri = getURI(type, encodeURIComponent((type=='station')?items[0].id:items[0].uri));
   
  return UaM;
}

function loadTracks(type, tracksJson)
{
  var tracks = { count : 0,
                 isArtist : false,
                 queueTracks : []
                };
                
  if (tracksJson.tracks.items.length > 0) {
    // Filtered list of tracks to play
    tracks.queueTracks = tracksJson.tracks.items.reduce(function(tracksArray, track) {
      if (track.available_markets.indexOf(country) != -1) {
        var skip = false;
  
        for (var j=0; (j < tracksArray.length) && !skip ; j++) {
          // Skip duplicate songs
          skip = (track.name == tracksArray[j].trackName);
        }
                    
        if (!skip) {
          var metadataID = spotifyDef.metastart['song'] + encodeURIComponent(track.id);
          var metadata = getMetadata('song', metadataID, track.id, track.name);
          var uri = getURI('song', encodeURIComponent(track.id));

          tracksArray.push({trackName:track.name, artistName:(track.artists.length>0)?track.artists[0].name:'', uri:uri, metadata:metadata});
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
  var count = 0;

  if (type == 'album') {
    count = resList.albums.items.length;
  } else 
  if (type == 'song') {
    count = resList.tracks.items.length;
  } else
  if (type == 'station') {
    count = resList.artists.items.length;
  }
  
  return (count == 0);
}
  
module.exports = spotifyDef;
  
