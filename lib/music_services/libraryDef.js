'use strict';
const Fuse = require('fuse.js');
const fs = require("fs");

const libraryPath = "./lib/library.json";

var musicLibrary = null;
var fuzzyTracks = null;
var fuzzyAlbums = null;

var isLoading = false;


const libraryDef = {
  country:   '',
  search:   {
               album:   '',
               song:    '',
               station: ''
             },
  metastart: {
               album:   'S:',
               song:    'S:',
               station: ''
             },
  parent:    {
               album:   'A:ALBUMARTIST/',
               song:    'A:ALBUMARTIST/',
               station: ''
             },
  object:    {
               album:   'item.audioItem.musicTrack',
               song:    'item.audioItem.musicTrack',
               station: ''
             },
  token:     'RINCON_AssociatedZPUDN',    
  
  service:   setService,
  term:      getSearchTerm,  
  tracks:    loadTracks,
  nolib:     libIsEmpty,
  read:      readLibrary,
  load:      loadLibrarySearch,
  search:    searchLibrary,
  empty:     isEmpty,
  metadata:  getMetadata
}  


function setService(p_sid, p_accountId, p_accountSN, p_country)
{
}

function getSearchTerm(type, term, artist, album, track) {
  var newTerm = artist;
  
  if ((newTerm != '') && ((artist != '') || (track != ''))) {
    newTerm += ' ';
  }
  newTerm += (type == 'album')?album:track;
  
  return newTerm;
}

function getMetadata(type, id, name, title) {
  const token = libraryDef.token;
  const parentUri = libraryDef.parent[type] + name;
  const objectType = libraryDef.object[type];
  
  return `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/"
          xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
          <item id="${id}" parentID="${parentUri}" restricted="true"><dc:title>${title}</dc:title><upnp:class>object.${objectType}</upnp:class>
          <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">${token}</desc></item></DIDL-Lite>`;
}

function loadTracks(type, tracksJson)
{
  var tracks = { count : 0,
                 isArtist : false,
                 queueTracks : []
                };
                
  if (tracksJson.length > 0) {
    var albumName = tracksJson[0].albumName;
      
    // Filtered list of tracks to play
    tracks.queueTracks = tracksJson.reduce(function(tracksArray, track) {
      if (tracks.count < 50) {  
        var skip = false;
          
        if (type == 'song') {
          for (var j=0; (j < tracksArray.length) && !skip ; j++) {
            // Skip duplicate songs
            skip = (track.trackName == tracksArray[j].trackName);
          }
        } else {
          skip = (track.albumName != albumName);
        }          
        if (!skip) {
          tracksArray.push({trackName:track.trackName, artistName:track.artistName, uri:track.uri, metadata:track.metadata});
          tracks.count++;
        }
      }
      return tracksArray;
    }, []);
  }
  
  return tracks;
}

function libIsEmpty() {
  return (musicLibrary == null);
}

function loadFuse(fuzzyKeys) {
  return new Promise((resolve) => {
    return resolve(new Fuse(musicLibrary.items, {keys: fuzzyKeys, threshold: 0.2, distance: 5, maxPatternLength: 100 }));
  });
}

function isFinished(chunk) {
  return chunk.startIndex + chunk.numberReturned >= chunk.totalMatches;
}

function loadLibrary(player) {
  
  if (isLoading) {
    return Promise.resolve('Loading');
  }
  console.log("Loading Library");
  isLoading = true;

  let result = {
    items: [],
    startIndex: 0,
    numberReturned: 0,
    totalMatches: 1
  };

  let getChunk = (chunk) => {
    chunk.items.reduce(function(tracksArray, track) 
    {
      var metadataID = libraryDef.metastart['song'] + track.uri.substring(track.uri.indexOf(':')+1);
      var metadata = getMetadata('library', 'song', metadataID,encodeURIComponent(track.artist) + '/' + encodeURIComponent(track.album), track.title);           
      result.items.push({artistTrackSearch:track.artist+' '+track.title, artistAlbumSearch:track.artist+' '+track.album, trackName:track.title, artistName:track.artist, albumName:track.album, uri:track.uri, metadata:metadata});
    }, []);

    result.numberReturned += chunk.numberReturned;
    result.totalMatches = chunk.totalMatches;
    console.log("Track Count " + result.numberReturned);

    if (isFinished(chunk)) {
      return new Promise((resolve, reject) => { 
        fs.writeFile(libraryPath,JSON.stringify(result),(err) => {
          isLoading = false;
          if (err) {
            console.log("ERROR: " + JSON.stringify(err));
            return reject(err);
          } else {
            return resolve(result);
          }  
        });
      });
    }

    // Recursive promise chain
    return player.browse('A:TRACKS', chunk.startIndex + chunk.numberReturned, 0)
      .then(getChunk);
  }

  return Promise.resolve(result)
    .then(getChunk);
}

function loadLibrarySearch(player, load) {
  if (load || (musicLibrary == null)) {
    return loadLibrary(player)
      .then((result) => {
        musicLibrary = result;
      })
      .then(() => loadFuse(["artistTrackSearch", "artistName", "trackName"]))
      .then((result) => {
        fuzzyTracks = result;
      })
      .then(() => loadFuse(["artistAlbumSearch", "artistName", "albumName"]))
      .then((result) => {
        fuzzyAlbums = result;
        return Promise.resolve("Library and search loaded");
      });
  } else {
    return loadFuse(["artistTrackSearch", "artistName", "trackName"])
      .then((result) => {
        fuzzyTracks = result;
      })
      .then(() => loadFuse(["artistAlbumSearch", "artistName", "albumName"]))
      .then((result) => {
        fuzzyAlbums = result;
        return Promise.resolve("Library search loaded");
      });
  }
}

function searchLibrary(type, term) {
  term = decodeURIComponent(term);

  return (type == 'album')?fuzzyAlbums.search(term):fuzzyTracks.search(term);
}

function isEmpty(type, resList)
{
  return (resList.length == 0);
}

function handleLibrary(err, data) {
  if (!err) {
    musicLibrary = JSON.parse(data);
    if (musicLibrary != null) {    
      loadLibrarySearch(null, false);
    }
  }  
}

function readLibrary() {
  fs.readFile(libraryPath, handleLibrary);
}

module.exports = libraryDef;
