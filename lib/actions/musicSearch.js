'use strict';
const request = require('request-promise');
const fs = require("fs");
const isRadioOrLineIn = require('../helpers/is-radio-or-line-in');

const appleDef = require('../music_services/appleDef');
const spotifyDef = require('../music_services/spotifyDef');
const deezerDef = require('../music_services/deezerDef');
const eliteDef = deezerDef.init(true);
const libraryDef = require('../music_services/libraryDef');

const musicServices = ['apple','spotify','deezer','elite','library'];
const serviceNames = {apple:'Apple Music',spotify:'Spotify',deezer:'Deezer',elite:'Deezer',library:'Library'};
const musicTypes = ['album','song','station','load','playlist'];

var country = '';
var accountId = '';
var accountSN = '';
var searchType = 0;

function getService(service) {
  if (service == 'apple') {
    return appleDef;
  } else
  if (service == 'spotify') {
    return spotifyDef;
  } else
  if (service == 'deezer') {
    return deezerDef;
  } else
  if (service == 'elite') {
    return eliteDef;
  } else
  if (service == 'library') {
    return libraryDef;
  }
}

function getAccountId(player, service)
{
  accountId = '';
  
  if (service != 'library') {
    return request({url: player.baseUrl + '/status/accounts',json: false})
      .then((res) => {
        var actLoc = res.indexOf(player.system.getServiceType(serviceNames[service]));
       
        if (actLoc != -1) {
          var idLoc = res.indexOf('<UN>', actLoc)+4;
          var snLoc = res.indexOf('SerialNum="', actLoc)+11;
  
          accountId = res.substring(idLoc,res.indexOf('</UN>',idLoc));
          accountSN = res.substring(snLoc,res.indexOf('"',snLoc));
        }
        
        return Promise.resolve();
      });
  
    return promise;
  } else {
    return Promise.resolve();
  }
}

function getRequestOptions(serviceDef, url) {
  const headers = serviceDef.headers();
  return {
    url: url,
    json: true,
    headers: headers,
  }
};

function doSearch(service, type, term)
{
  var serviceDef = getService(service);
  var url = serviceDef.search[type];
  var authenticate = serviceDef.authenticate;

  term = decodeURIComponent(term);

  // Check for search type specifiers 
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
      
    newTerm = serviceDef.term(type, term, artist, album, track);
      
  } else {
    newTerm = (service == 'library')?term:encodeURIComponent(term);
  }
    
  if (type == 'song') {
    searchType = (trackPos > -1)?1:((artistPos > -1)?2:0);
  }  
  url += newTerm;
  
  if (service == 'library') {
    return Promise.resolve(libraryDef.searchlib(type, newTerm));
  } else
  if ((serviceDef.country != '') && (country == '')) {
    return request({url: 'http://ipinfo.io',
                   json: true})
           .then((res) => {
             country = res.country;
             url += serviceDef.country + country;
             return authenticate().then(() => request(getRequestOptions(serviceDef, url)));
           });
  } else {
    if (serviceDef.country != '') {
      url += serviceDef.country + country;
    }
      
    return authenticate().then(() => request(getRequestOptions(serviceDef, url)));
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

function loadTracks(player, service, type, tracksJson)
{
  var tracks = getService(service).tracks(type, tracksJson);
  
  if ((service == 'library') && (type == 'album')) {
    tracks.isArtist = true;
  } else 
  if (type != 'album') {
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
  }
 
  //To avoid playing the same song first in a list of artist tracks when shuffle is on
  if (tracks.isArtist && player.coordinator.state.playMode.shuffle) {
    tracks.queueTracks.shuffle();  
  }
 
  return tracks;
}


function musicSearch(player, values) {
  const service = values[0];
  const type = values[1];
  const term = values[2];
  const queueURI = 'x-rincon-queue:' + player.coordinator.uuid + '#0';
 
  if (musicServices.indexOf(service) == -1) {
    return Promise.reject('Invalid music service');
  } 

  if (musicTypes.indexOf(type) == -1) {
    return Promise.reject('Invalid type ' + type);
  }
  
  if ((service == 'library') && ((type == 'load') || libraryDef.nolib())) {
    return libraryDef.load(player, (type == 'load'));
  }

  return getAccountId(player, service)
    .then(() => {
      return doSearch(service, type, term);
    })
    .then((resList) => {
      const serviceDef = getService(service);
      serviceDef.service(player, accountId, accountSN, country);
      if (serviceDef.empty(type, resList)) {
        return Promise.reject('No matches were found');
      } else {
        var UaM = null; 
      
        if (type == 'station') {
          UaM = serviceDef.urimeta(type, resList);

          return player.coordinator.setAVTransport(UaM.uri, UaM.metadata) 
            .then(() => player.coordinator.play());
        } else 
        if ((type == 'album' || type =='playlist') && (service != 'library')) {
          UaM = serviceDef.urimeta(type, resList);

          return player.coordinator.clearQueue()
            .then(() => player.coordinator.setAVTransport(queueURI, ''))
            .then(() => player.coordinator.addURIToQueue(UaM.uri, UaM.metadata, true, 1))
            .then(() => player.coordinator.play());
        } else { // Play songs
          var tracks = loadTracks(player, service, type, resList);
      
          if (tracks.count == 0) {
            return Promise.reject('No matches were found');
          } else {
            if (tracks.isArtist) {  // Play numerous songs by the specified artist
              return player.coordinator.clearQueue()
                .then(() => player.coordinator.setAVTransport(queueURI, ''))
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
                  empty = (queue.length == 0);
                  nextTrackNo = (empty) ? 1 : player.coordinator.state.trackNo + 1;
                })
                .then(() => player.coordinator.addURIToQueue(tracks.queueTracks[0].uri, tracks.queueTracks[0].metadata, true, nextTrackNo))
                .then(() => player.coordinator.setAVTransport(queueURI, ''))
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
  libraryDef.read();
};
