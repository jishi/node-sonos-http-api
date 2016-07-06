const settings = require('../../settings.json');
const request = require('request-promise');
const isRadioOrLineIn = require('../helpers/is-radio-or-line-in');


// Search logic ------------------------------------
var   country = '';
var   searchType = 0;

const COUNTRY_PARM = {
  apple:   '&country=',
  spotify: '&market=',
  deezer:  ''
};

const URLS = {
  apple:    {
              album:   'https://itunes.apple.com/search?media=music&limit=1&entity=album&attribute=albumTerm&term=',
              song:    'https://itunes.apple.com/search?media=music&limit=50&entity=song&term=',
              station: 'https://sticky-summer-lb.inkstone-clients.net/api/v1/searchMusic?limit=1&media=appleMusic&entity=station&term='
            },
  spotify:  {
              album:   'https://api.spotify.com/v1/search?type=album&limit=1&q=',
              song:    'https://api.spotify.com/v1/search?type=track&limit=50&q=',
              station: 'https://api.spotify.com/v1/search?type=artist&limit=1&q='
            },
  deezer:   {
              album:   'https://api.deezer.com/search?limit=1&q=album:',
              song:    'https://api.deezer.com/search?limit=50&q=',
              station: 'https://api.deezer.com/search?limit=1&q=artist:'
            }
};

function doSearch(service, type, term)
{
  var url = URLS[service][type];

  if ((type == 'song') || ((service == 'deezer') && (type == 'album'))) {
    term = decodeURIComponent(term);

    if (term.indexOf(':') > -1) {
      var newTerm = '';
      var artistPos = term.indexOf('artist:');
      var albumPos  = term.indexOf('album:');
      var trackPos  = term.indexOf('track:');
      var nextPos = -1;
      var artist = '';
      var album = '';
      var track  = '';
    
      if (artistPos > -1) {
        nextPos = (albumPos < trackPos)?albumPos:trackPos; 
        artist = term.substring(artistPos+7,(artistPos < nextPos)?nextPos:term.length);
      }
      if (albumPos > -1) {
        nextPos = (trackPos < artistPos)?trackPos:artistPos; 
        album = term.substring(albumPos+6,(albumPos < nextPos)?nextPos:term.length);
      }
      if (trackPos > -1) {
        nextPos = (albumPos < artistPos)?albumPos:artistPos; 
        track = term.substring(trackPos+6,(trackPos < nextPos)?nextPos:term.length);
      }
      if (service == 'apple') {
        newTerm = artist;
        if (newTerm != '') {
          newTerm += ' ';
        }
        newTerm += track;
      } else
      if ((service == 'spotify') || (service == 'deezer')) {
        if ((service == 'deezer') && (album != '')) {
          newTerm = album + ' ';
        }
        if (artist != '') {
          newTerm += 'artist:' + artist + ' ';
        }
        if (track != '') {
          newTerm += 'track:' + track;
        }
      }
    } else {
      newTerm = term;
    }
    
    if (type == 'song') {
      searchType = (trackPos > -1)?1:((artistPos > -1)?2:0);
    }  
    url += encodeURIComponent(newTerm);
  } else {
    url += term;
  }
  
  if ((COUNTRY_PARM[service] != '') && (country == '')) {
    return request({url: 'http://ipinfo.io',
                   json: true})
           .then((res) => {
             country = res.country;
             url += COUNTRY_PARM[service] + country;
             return request({url: url, json: true});
           });
  } else {
    if (COUNTRY_PARM[service] != '') {
      url += COUNTRY_PARM[service] + country;
    }
      
    return request({url: url, json: true});
  }
}


// Metadata logic ------------------------------------

const METADATA_URI_STARTERS = {
  apple:    {
              album:   '0004206calbum%3a',
              song:    '00032020song%3a',
              station: '000c206cradio%3a'
            },
  spotify:  {
              album:   '0004206cspotify%3aalbum%3a',
              song:    '00032020spotify%3atrack%3a',
              station: '000c206cspotify:artistRadio%3a'
            },
  deezer:   {
              album:   '0004006calbum-',
              song:    '00032020tr-flac%3a',
              station: '000c0068radio-artist-'
            }
};

const PARENTS = {
  apple :  {
              album:   '00020000album:',
              song:    '00020000song:',
              station: '00020000radio:'
            },
  spotify : {
              album:   '00020000album:',
              song:    '00020000track:',
              station: '00052064spotify%3aartist%3a'
            },
  deezer :  {
              album:   '00020000search-album:',
              song:    '00020000search-track:',
              station: '00050064artist-'
            }
};


const OBJECTS = {
  apple:    {
              album:   `container.album.musicAlbum.#AlbumView`,
              song:    `item.audioItem.musicTrack.#SongTitleWithArtistAndAlbum`,
              station: `item.audioItem.audioBroadcast`
            },
  spotify:  {
              album:   `container.album.musicAlbum`,
              song:    `item.audioItem.musicTrack`,
              station: `item.audioItem.audioBroadcast.#artistRadio`
            },
  deezer:   {
              album:   `container.album.musicAlbum.#DEFAULT`,
              song:    `item.audioItem.musicTrack.#DEFAULT`,
              station: `item.audioItem.audioBroadcast.#DEFAULT`
            }
};

const serviceTokens = {
  apple:   'SA_RINCON52231_X_#Svc52231-0-Token',
  spotify: 'SA_RINCON3079_X_#Svc3079-0-Token',
  deezer:  'SA_RINCON43015_'
};

function getMetadata(service, type, id, name, title) {
  const token = serviceTokens[service] + ((service == 'deezer')?settings.deezer.username:'');
  const parentUri = PARENTS[service][type] + name;
  const objectType = OBJECTS[service][type];
  
  return `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/"
          xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
          <item id="${id}" parentID="${parentUri}" restricted="true"><dc:title>${title}</dc:title><upnp:class>object.${objectType}</upnp:class>
          <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">${token}</desc></item></DIDL-Lite>`;
}

function getAlbumUri(service, id) {
  if (service == 'apple') {
    return `x-rincon-cpcontainer:0004206calbum%3a${id}`;
  } else
  if (service == 'spotify') {
	return `x-rincon-cpcontainer:0004206c${id}`;
  } else
  if (service == 'deezer') {
	return `x-rincon-cpcontainer:0004006calbum-${id}`;
  }
}

function getSongUri(service, id) {
  if (service == 'apple') {
    return `x-sonos-http:song%3a${id}.mp4?sid=204&flags=8224&sn=13`;
  } else
  if (service == 'spotify') {
	return `x-sonos-spotify:spotify%3atrack%3a${id}?sid=12&flags=8224&sn=15`;
  } else
  if (service == 'deezer') {
	return `x-sonos-http:tr-flac%3a${id}.flac?sid=168&flags=8224&sn=16`;
  }
}

function getStationUri(service, id) {
  if (service == 'apple') {
    return `x-sonosapi-radio:radio%3a${id}?sid=204&flags=8300&sn=13`;
  } else
  if (service == 'spotify') {
	return `x-sonosapi-radio:spotify%3aartistRadio%3a${id}?sid=12&flags=8300&sn=15`;
  } else
  if (service == 'deezer') {
	return `x-sonosapi-radio:radio-artist-${id}?sid=168&flags=104&sn=16`;
  }
}

const uriTemplates = {
  album:   getAlbumUri,
  song:    getSongUri,
  station: getStationUri
};

function getURIandMetadata(player, service, type, resList)
{
  var Id = '';
  var Title = '';
  var Name = '';
  var MetadataID = '';
  var UaM = {
              uri: '',
              metadata: ''
            };

  if (service == 'apple') {
    Id = (type=='album')?resList.results[0].collectionId:resList.results[0].id;
    Title = (type=='album')?resList.results[0].collectionName:resList.results[0].name;
    Name = Title.toLowerCase().replace(' radio','').replace('radio ','').replace("'","&apos;");
    MetadataID = METADATA_URI_STARTERS[service][type] + encodeURIComponent(Id);
    
    UaM.metadata = getMetadata(service, type, MetadataID, Name, Title);
    UaM.uri = uriTemplates[type](service, encodeURIComponent(Id));
  } else
  if (service == 'spotify') {
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
    MetadataID = METADATA_URI_STARTERS[service][type] + encodeURIComponent(Id);
    
    UaM.metadata = getMetadata(service, type, MetadataID, (type=='album')?Title.toLowerCase():Id, Title);
    UaM.uri = uriTemplates[type](service, encodeURIComponent((type=='station')?items[0].id:items[0].uri));
  } else
  if (service == 'deezer') {
    Id = (type=='album')?resList.data[0].album.id:resList.data[0].artist.id;
    Title = (type=='album')?resList.data[0].album.title:(resList.data[0].artist.name + ' Radio');
    Name = Title.toLowerCase().replace(' radio','').replace('radio ','').replace("'","&apos;");
    MetadataID = METADATA_URI_STARTERS[service][type] + encodeURIComponent(Id);
    
    UaM.metadata = getMetadata(service, type, MetadataID, Id, Title);
    UaM.uri = uriTemplates[type](service, encodeURIComponent(Id));
  }
   
  return UaM;
}


// Track loading logic ------------------------------------

function loadTracks(service, tracksJson, searchType)
{
  var tracks = { count : 0,
                 isArtist : false,
                 queueTracks : []
                };
  // Load the tracks from the json results data
  if (service == 'apple') {
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
            var metadataID = METADATA_URI_STARTERS[service]['song'] + encodeURIComponent(track.trackId);
            var metadata = getMetadata(service, 'song', metadataID, track.trackId, track.trackName);
            var uri = uriTemplates['song'](service, encodeURIComponent(track.trackId));

            tracksArray.push({trackName:track.trackName, artistName:track.artistName, uri:uri, metadata:metadata});
            tracks.count++;
          }
        } 
        return tracksArray;
      }, []);
    }
  } else 
  if (service == 'spotify') {
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
            var metadataID = METADATA_URI_STARTERS[service]['song'] + encodeURIComponent(track.id);
            var metadata = getMetadata(service, 'song', metadataID, track.id, track.name);
            var uri = uriTemplates['song'](service, encodeURIComponent(track.id));

            tracksArray.push({trackName:track.name, artistName:(track.artists.length>0)?track.artists[0].name:'', uri:uri, metadata:metadata});
            tracks.count++;
          }
        } 
        return tracksArray;
      }, []);
    }
  } else 
  if (service == 'deezer') {
    if (tracksJson.data.length > 0) {
      // Filtered list of tracks to play
      tracks.queueTracks = tracksJson.data.reduce(function(tracksArray, track) {
        var skip = false;
  
        for (var j=0; (j < tracksArray.length) && !skip ; j++) {
            // Skip duplicate songs
          skip = (track.title == tracksArray[j].trackName);
        }
                    
        if (!skip) {
          var metadataID = METADATA_URI_STARTERS[service]['song'] + encodeURIComponent(track.id);
          var metadata = getMetadata(service, 'song', metadataID, track.id, track.title);
          var uri = uriTemplates['song'](service, encodeURIComponent(track.id));

          tracksArray.push({trackName:track.title, artistName:track.artist.name, uri:uri, metadata:metadata});
          tracks.count++;
        }
        return tracksArray;
      }, []);
    }
  }
  
  if (searchType == 0) {
    // Determine if the request was for a specific song or for many songs by a specific artist
    if (tracks.count > 1) {
      var artistCount = 1;
      var trackCount = 1;
      var artists = tracks.queueTracks.map(function(track) {
            return track.artistName.toLowerCase();
          }).sort();
      var songs = tracks.queueTracks.map(function(track) {
            return track.trackName.toLowerCase();
          }).sort();

      var prevArtist=artists[0];
      var prevTrack=songs[0];

      for (var i=1; i < tracks.count;i++) {
        if (artists[i] != prevArtist) {
          artistCount++;
          prevArtist = artists[i];
        }
        if (songs[i] != prevTrack) {
          trackCount++;
          prevTrack = songs[i];
        }  
      }
      tracks.isArtist = (trackCount/artistCount > 2);
    }
  } else {
    tracks.isArtist = (searchType == 2);
  }
  
  return tracks;
}

//----------------------------------------------

function isEmpty(service, type, resList)
{
  var count = 0;

  if (service == 'apple') {
    count = resList.resultCount;
  } else
  if (service == 'spotify') {
    if (type == 'album') {
      count = resList.albums.items.length;
    } else 
    if (type == 'song') {
      count = resList.tracks.items.length;
    } else
    if (type == 'station') {
      count = resList.artists.items.length;
    }
  } else
  if (service == 'deezer') {
    count = resList.data.length;
  }
  
  return (count == 0);
}



function musicSearch(player, values) {
  const service = values[0];
  const type = values[1];
  const term = values[2];
  const queueURI = 'x-rincon-queue:' + player.uuid + '#0';

  if ((service != 'apple') && (service != 'spotify') && (service != 'deezer')) {
    return Promise.reject('Invalid music service');
  } 

  if ((type != 'album') && (type != 'song') && (type != 'station')) {
    return Promise.reject('Invalid type ' + type);
  }

  return doSearch(service, type, term)
    .then((resList) => {
      if (isEmpty(service, type, resList)) {
        return Promise.reject('No matches were found');
      } else {
        var UaM = null; 
      
        if (type == 'station') {
          UaM = getURIandMetadata(player, service, type, resList);

          return player.coordinator.setAVTransport(UaM.uri, UaM.metadata) 
            .then(() => player.coordinator.play());
        } else 
        if (type == 'album') {
          UaM = getURIandMetadata(player, service, type, resList);

          return player.coordinator.clearQueue()
            .then(() => {
              if (isRadioOrLineIn(player.coordinator.avTransportUri)) {
                return player.coordinator.setAVTransport(queueURI, '');
              }
            })
            .then(() => player.coordinator.addURIToQueue(UaM.uri, UaM.metadata, true, 1))
            .then(() => player.coordinator.play());
        } else { // Play songs
          var tracks = loadTracks(service, resList, searchType);
      
          if (tracks.count == 0) {
            return Promise.reject('No matches were found');
          } else {
            if (tracks.isArtist) {  // Play numerous songs by the specified artist
              return player.coordinator.clearQueue()
                .then(() => {
                  if (isRadioOrLineIn(player.coordinator.avTransportUri)) {
                    return player.coordinator.setAVTransport(queueURI, '');
                  }
                })
                .then(() => player.coordinator.addURIToQueue(tracks.queueTracks[0].uri, tracks.queueTracks[0].metadata, true, 1))
                .then(() => player.coordinator.play())
                .then(() => {
                // Do not return promise since we want to be considered done from the calling context
                  tracks.queueTracks.slice(1).reduce((promise, track, index) => {
                    return promise.then(() => player.coordinator.addURIToQueue(track.uri, track.metadata, true, index + 2));
                  }, Promise.resolve());
                });
            } else { // Play the one specified song
              var empty = false;
              var nextTrackNo = 0;

              return player.coordinator.getQueue(0, 1)
                .then((queue) => {
                  empty = (queue.numberReturned == 0);
                  nextTrackNo = (empty) ? 1 : player.coordinator.state.trackNo + 1;
                })
                .then(() => player.coordinator.addURIToQueue(tracks.queueTracks[0].uri, tracks.queueTracks[0].metadata, true, nextTrackNo))
                .then(() => {
                  if (isRadioOrLineIn(player.coordinator.state.currentTrack.uri)) {
                    return player.coordinator.setAVTransport(queueURI, '');
                  }
                })
                .then(() => {
                  if (!empty) {
                    return player.coordinator.nextTrack();
                  }
                })
                .then(() => player.coordinator.play());
            }
          }
        }
      }
    });
}

module.exports = function (api) {
  api.registerAction('musicsearch', musicSearch);
};
