'use strict';
const promise = require('request-promise');
const Anesidora = require("anesidora");
const Fuse = require('fuse.js');
const settings = require('../../settings');

function getPandoraMetadata(id, title, auth) {
  return `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/"
        xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
        <item id="OOOX${id}" parentID="0" restricted="true"><dc:title>${title}</dc:title><upnp:class>object.item.audioItem.audioBroadcast</upnp:class>
        <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON3_${auth}</desc></item></DIDL-Lite>`;
}

function getPandoraUri(id, title, albumart) {
  if (albumart == undefined) {
    return `pndrradio:${id}?sn=2`;
  } else {
    return `pndrradio:${id}?sn=2,"title":"${title}","albumArtUri":"${albumart}"`;
  }  
}


function pandora(player, values) {
  const cmd = values[0];

  function userLogin() {
    return new Promise(function(resolve, reject) {
      pAPI.login(function(err) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
    });
  }

  function pandoraAPI(command, parameters) {
    return new Promise(function(resolve, reject) {
      pAPI.request(command, parameters, function(err, result) {
        if (!err) {
          resolve(result);
        } else {
          console.log("pandoraAPI " + command + " " + JSON.stringify(parameters));
          console.log("ERROR: " + JSON.stringify(err));
          reject(err);
        }
      });
    });
  }

  function playPandora(player, name) {
    var uri = '';
    var metadata = '';

    return userLogin()
      .then(() => pandoraAPI("user.getStationList", {"includeStationArtUrl" : true}))
      .then((stationList) => {
        return pandoraAPI("music.search", {"searchText": name})
          .then((result) => {
            if (result.artists != undefined) {          
              result.artists.map(function(artist) {
                if (artist.score > 90) {
                  stationList.stations.push({"stationId":artist.musicToken,"stationName":artist.artistName,"type":"artist"});
                }
              });
            }
            if (result.songs != undefined) {          
              result.songs.map(function(song) { 
                if (song.score > 90) {
                  stationList.stations.push({"stationId":song.musicToken,"stationName":song.songName,"type":"song"});
                }
              });
            }
            return pandoraAPI("station.getGenreStations", {});
          })
          .then((result) => { 
            result.categories.map(function(category) {
              category.stations.map(function(genreStation) {
                stationList.stations.push({"stationId":genreStation.stationToken,"stationName":genreStation.stationName,"type":"song"});
              });
            });
            var fuzzy = new Fuse(stationList.stations, { keys: ["stationName"] });
                 
            const results = fuzzy.search(name);
            if (results.length > 0) {
              const station = results[0];
              if (station.type == undefined) {
                uri = getPandoraUri(station.stationId, station.stationName, station.artUrl);
                metadata = getPandoraMetadata(station.stationId, station.stationName, settings.pandora.username);
                return Promise.resolve();
              } else {
                return pandoraAPI("station.createStation", {"musicToken":station.stationId, "musicType":station.type})
                  .then((stationInfo) => {
                  	 uri = getPandoraUri(stationInfo.stationId);
                     metadata = getPandoraMetadata(stationInfo.stationId, stationInfo.stationName, settings.pandora.username);
                     return Promise.resolve();
                  });
              }
            } else {
              return Promise.reject("No match was found");
            }  
          }) 
          .then(() => player.coordinator.setAVTransport(uri, metadata))
          .then(() => player.coordinator.play());
      });  
  }

  if (settings && settings.pandora) {
    var pAPI = new Anesidora(settings.pandora.username, settings.pandora.password);

    if (cmd == 'play') {
      return playPandora(player, values[1]);
    } if ((cmd == 'thumbsup')||(cmd == 'thumbsdown')) {
      const uri = player.state.currentTrack.uri;
   
      if (uri.startsWith('pndrradio-http')) {
        const stationToken = uri.substring(uri.search('&x=') + 3);
        const trackToken = uri.substring(uri.search('&m=') + 3,uri.search('&f='));
        const up = (cmd == 'thumbsup');

        return userLogin()
          .then(() => pandoraAPI("station.addFeedback", {"stationToken" : stationToken, "trackToken" : trackToken, "isPositive" : up}))
          .then(() => {
            if (cmd == 'thumbsdown') {
              return player.coordinator.nextTrack();
            } 
          });
      } else {
        return Promise.reject('The music that is playing is not a Pandora station');
      }
    }
  } else {
    console.log('Missing Pandora settings');
    return Promise.reject('Missing Pandora settings');
  }
  
}


module.exports = function (api) {
  api.registerAction('pandora', pandora);
}

