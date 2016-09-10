'use strict';
const promise = require('request-promise');
const Anesidora = require("anesidora");
const Fuse = require('fuse.js');

let settings = {};

try {
  settings = require('../../settings.json');
} catch (e) {}

function getPandoraMetadata(id, title, auth) {
  return `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/"
        xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
        <item id="OOOX${id}" parentID="0" restricted="true"><dc:title>${title}</dc:title><upnp:class>object.item.audioItem.audioBroadcast</upnp:class>
        <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON3_${auth}</desc></item></DIDL-Lite>`;
}

function getPandoraUri(id, title, albumart) {
  return `pndrradio:${id}?sn=2,"title":"${title}","albumArtUri":"${albumart}"`;
  return `x-sonos-http:${id}.mp4?sid=204&flags=8224&sn=4`;

}


function pandora(player, values) {
  const cmd = values[0];


  function playPandora(player, name) {
    return new Promise(function(resolve, reject) {
    
        pAPI.login(function(err) {
           if (!err) {
             pAPI.request("user.getStationList", {"includeStationArtUrl" : true}, function(err, stationList) {
               if (!err) {
                 var fuzzy = new Fuse(stationList.stations, { keys: ["stationName"] });
                 results = fuzzy.search(name);
                 if (results.length > 0) {
                   station = results[0];
                   const uri = getPandoraUri(station.stationId, station.stationName, station.artUrl);
                   const metadata = getPandoraMetadata(station.stationId, station.stationName, 'the.plourdes@gmail.com');
        
                   return player.coordinator.setAVTransport(uri, metadata) 
                     .then(() => player.coordinator.play())
                     .then(() => resolve());
                 } else {
                   reject('No match found for ' + name);
                 } 
               }
             });
           } else {
             console.log(err);
             reject('Error logging into the Pandora API');
           }
        });
    });
  }

  function thumbsPandora(sid, tid, up) {
    return new Promise(function(resolve, reject) {

        pAPI.login(function(err) {
           if (!err) {
             const req = {"stationToken" : sid, 
                          "trackToken" : tid, 
                          "isPositive" : up};
             console.log(req);             
         
             pAPI.request("station.addFeedback", req, function(err, result) {
               if (!err) {
                 resolve();
               } else {
                 reject('There was a problem recording your thumbs ' + ((up)?'up':'down'));
               }
             });
           } else {
             console.log(err);
             reject('Error logging into the Pandora API');
           }
        });
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

        return thumbsPandora(stationToken, trackToken, (cmd == 'thumbsup'))
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

