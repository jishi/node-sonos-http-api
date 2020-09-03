'use strict';
const Fuse = require('fuse.js');
const fs = require('fs');
const path = require('path');
const settings = require('../../settings');
const libraryPath = path.join(settings.cacheDir, 'library.json');
const logger = require('sonos-discovery/lib/helpers/logger');

var randomQueueLimit = (settings.library && settings.library.randomQueueLimit !== undefined)?settings.library.randomQueueLimit:50;

var musicLibrary = null;
var currentLibVersion = 1.4;
var fuzzyTracks = null;
var fuzzyAlbums = null;

var isLoading = false;


const libraryDef = {
  country: '',
  search: {
    album: '',
    song: '',
    station: ''
  },
  metastart: {
    album: 'S:',
    song: 'S:',
    station: ''
  },
  parent: {
    album: 'A:ALBUMARTIST/',
    song: 'A:ALBUMARTIST/',
    station: ''
  },
  object: {
    album: 'item.audioItem.musicTrack',
    song: 'item.audioItem.musicTrack',
    station: ''
  },
  token: 'RINCON_AssociatedZPUDN',

  service: setService,
  term: getSearchTerm,
  tracks: loadTracks,
  nolib: libIsEmpty,
  read: readLibrary,
  load: loadLibrarySearch,
  searchlib: searchLibrary,
  empty: isEmpty,
  metadata: getMetadata,
  urimeta: getURIandMetadata,
  headers: getTokenHeaders,
  authenticate: authenticateService
}

function getTokenHeaders() {
  return null;
}

function authenticateService() {
  return Promise.resolve();
}

function setService(player, p_accountId, p_accountSN, p_country) {
}

function getSearchTerm(type, term, artist, album, track) {
  var newTerm = artist;

  if ((newTerm != '') && ((artist != '') || (track != ''))) {
    newTerm += ' ';
  }
  newTerm += (type == 'album') ? album : track;

  return newTerm;
}

function getMetadata(type, id, name) {
  const token = libraryDef.token;
  const parentUri = libraryDef.parent[type] + name;
  const objectType = libraryDef.object[type];

  return `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/"
          xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
          <item id="${id}" parentID="${parentUri}" restricted="true"><dc:title></dc:title><upnp:class>object.${objectType}</upnp:class>
          <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">${token}</desc></item></DIDL-Lite>`;
}

function getURIandMetadata(type, resList) {
  return { uri: resList[0].uri, metadata: resList[0].metadata };
}

function loadTracks(type, tracksJson) {
  var tracks = {
    count: 0,
    isArtist: false,
    queueTracks: []
  };

  if (tracksJson.length > 0) {
    var albumName = tracksJson[0].item.albumName;

    // Filtered list of tracks to play
    tracks.queueTracks = tracksJson.reduce(function(tracksArray, track) {
      if (tracks.count < randomQueueLimit) {
        var skip = false;

        if (type == 'song') {
          for (var j = 0; (j < tracksArray.length) && !skip; j++) {
            // Skip duplicate songs
            skip = (track.item.trackName == tracksArray[j].trackName);
          }
        } else {
          skip = (track.item.albumName != albumName);
        }          
        if (!skip) {
          tracksArray.push({
            trackName: track.item.trackName,
            artistName: track.item.artistName,
            albumTrackNumber:track.item.albumTrackNumber, 
            uri: track.item.uri,
            metadata: track.item.metadata
          });
          tracks.count++;
        }
      }
      return tracksArray;
    }, []);
  }
  
  if (type == 'album') {
    tracks.queueTracks.sort(function(a,b) {
      if (a.artistName != b.artistName) {
        return (a.artistName > b.artistName)? 1 : -1;
      } else {
        return a.albumTrackNumber - b.albumTrackNumber;
      }
    });
  }

  return tracks;
}

function libIsEmpty() {
  return (musicLibrary == null);
}

function loadFuse(items, fuzzyKeys) {
  return new Promise((resolve) => {
    return resolve(new Fuse(items, { keys: fuzzyKeys, threshold: 0.2, maxPatternLength: 100, ignoreLocation: true }));
  });
}

function isFinished(chunk) {
  return chunk.startIndex + chunk.numberReturned >= chunk.totalMatches;
}

function loadLibrary(player) {

  if (isLoading) {
    return Promise.resolve('Loading');
  }
  logger.info('Loading Library');
  isLoading = true;

  let library = {
    version: currentLibVersion,
    tracks: {
      items: [],
      startIndex: 0,
      numberReturned: 0,
      totalMatches: 1
    }
  };

  let result = library.tracks;

  let getChunk = (chunk) => {
    chunk.items.reduce(function (tracksArray, item) {
      if ((item.uri != undefined) && (item.artist != undefined) && (item.album != undefined)) {
        var metadataID = libraryDef.metastart['song'] + item.uri.substring(item.uri.indexOf(':') + 1);
        var metadata = getMetadata('song', metadataID, encodeURIComponent(item.artist) + '/' + encodeURIComponent(item.album));
        result.items.push({
          artistTrackSearch: item.artist + ' ' + item.title,
          artistAlbumSearch: item.artist + ' ' + item.album,
          trackName: item.title,
          artistName: item.artist,
          albumName: item.album,
          albumTrackNumber: item.albumTrackNumber,
          uri: item.uri,
          metadata: metadata
        });
      }
    }, []);

    result.numberReturned += chunk.numberReturned;
    result.totalMatches = chunk.totalMatches;
    logger.info(`Tracks returned: ${result.numberReturned}, Total matches: ${result.totalMatches}`);

    if (isFinished(chunk)) {
      return new Promise((resolve, reject) => {
        fs.writeFile(libraryPath, JSON.stringify(library), (err) => {
          isLoading = false;
          if (err) {
            console.log("ERROR: " + JSON.stringify(err));
            return reject(err);
          } else {
            return resolve(library);
          }
        });
      });
    }

    // Recursive promise chain
    return player.browse('A:TRACKS', chunk.startIndex + chunk.numberReturned, 0)
      .then(getChunk);
  }

  return Promise.resolve(result)
    .then(getChunk)
    .catch((err) => {
      logger.error('Error when recursively trying to load library using browse()', err);
    });
}

function loadLibrarySearch(player, load) {
  if (load || (musicLibrary == null)) {
    return loadLibrary(player)
      .then((result) => {
        musicLibrary = result;
      })
      .then(() => loadFuse(musicLibrary.tracks.items, ["artistTrackSearch", "artistName", "trackName"]))
      .then((result) => {
        fuzzyTracks = result;
      })
      .then(() => loadFuse(musicLibrary.tracks.items, ["artistAlbumSearch", "albumName", "artistName"]))
      .then((result) => {
        fuzzyAlbums = result;
        return Promise.resolve("Library and search loaded");
      });
  } else {
    return loadFuse(musicLibrary.tracks.items, ["artistTrackSearch", "artistName", "trackName"])
      .then((result) => {
        fuzzyTracks = result;
      })
      .then(() => loadFuse(musicLibrary.tracks.items, ["artistAlbumSearch", "albumName", "artistName"]))
      .then((result) => {
        fuzzyAlbums = result;
        return Promise.resolve("Library search loaded");
      });
  }
}

Array.prototype.shuffle=function(){
  var len = this.length,temp,i
  while(len){
    i=Math.random()*len-- >>> 0;
    temp=this[len],this[len]=this[i],this[i]=temp;
  }
  return this;
}

function searchLibrary(type, term) {
  term = decodeURIComponent(term);

  return (type == 'album') ? fuzzyAlbums.search(term) : fuzzyTracks.search(term).shuffle().slice(0,randomQueueLimit);
}

function isEmpty(type, resList) {
  return (resList.length == 0);
}

function handleLibrary(err, data) {
  if (!err) {
    musicLibrary = JSON.parse(data);
    if ((musicLibrary.version == undefined) || (musicLibrary.version < currentLibVersion)) { // Ignore if older format
      musicLibrary = null;
    }
    if (musicLibrary != null) {
      loadLibrarySearch(null, false);
    }
  }
}

function readLibrary() {
  fs.readFile(libraryPath, handleLibrary);
}

module.exports = libraryDef;
