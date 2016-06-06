var request = require('request-promise');


function getMetadata(id, parentUri, type, title) {
  return `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/"
  xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
  <item id="${id}" parentID="${parentUri}" restricted="true"><dc:title>"${title}"</dc:title><upnp:class>object.item.audioItem.${type}</upnp:class>
  <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON52231_X_#Svc52231-0-Token</desc></item></DIDL-Lite>`;
}

function getSongUri(id) {
  return `x-sonos-http:${id}.mp4?sid=204&flags=8224&sn=4`;
}

function getAlbumUri(id) {
  return `x-rincon-cpcontainer:0004206c${id}`;
}

function getNameUri(id) {
  return `x-sonos-http:${id}.mp4?sid=204&flags=8224&sn=13`;
}

function getRadioUri(id) {
  return `x-sonosapi-radio:${id}?sid=204&flags=8300&sn=13`;
}

const uriTemplates = {
  song: getSongUri,
  album: getAlbumUri,
  name: getNameUri,
  radio: getRadioUri
};

const CLASSES = {
  song: 'musicTrack',
  album: 'musicAlbum',
  name: 'musicTrack',
  radio: 'audioBroadcast'
};

const METADATA_URI_STARTERS = {
  song: '00032020',
  album: '0004206c',
  name: '00032020',
  radio: '000c206c'
};

const PARENTS = {
  song: '0004206calbum%3a',
  album: '00020000album%3a',
  name: '00020000song:',
  radio: '00020000radio%3a'
};

function radioOn(player) {
  const uri = player.coordinator.state.currentTrack.uri;
  
  return uri.startsWith('x-sonosapi-stream:') ||
         uri.startsWith('x-sonosapi-radio:') ||
         uri.startsWith('pndrradio:') ||
         uri.startsWith('x-sonosapi-hls:');
}

function appleMusic(player, values) {
  const action = values[0];
  const trackID = values[1];
  const type = trackID.split(':')[0];
  var   nextTrackNo = 0;

  if ((action == 'radio') || ((action == 'queue') && (type == 'name'))) {
    if (action == 'radio') {
      return request({url: 'https://sticky-summer-lb.inkstone-clients.net/api/v1/searchMusic?limit=1&media=appleMusic&entity=station&term=' + trackID.split(':')[1],
                     json: true})
        .then((radioStations) => {
          if (radioStations.resultCount == 0) {
            Promise.reject('No matches were found');
          } else {
            const radioID = radioStations.results[0].id;
            const radioTitle = radioStations.results[0].name;
            const radioName = radioStations.results[0].name.toLowerCase().replace(' radio','');
            const metadataID = METADATA_URI_STARTERS[type] + encodeURIComponent('radio:' + radioStations.results[0].id);
            const metadata = getMetadata(metadataID, PARENTS[type] + radioName, CLASSES[type], radioTitle);
            const uri = uriTemplates[type](encodeURIComponent('radio:' + radioID));

            return player.coordinator.setAVTransport(uri, metadata) 
              .then(() => player.coordinator.play());
          }
        });
    } else {
      return request({url: 'https://itunes.apple.com/search?media=music&limit=50&entity=song&term=' + trackID.split(':')[1],
                     json: true})
        .then(function(tracksJson) {
          if (tracksJson.resultCount == 0) {
            Promise.reject('No matches were found');
          } else {
            var trkNum = 0;
           
            while ((trkNum < tracksJson.resultCount) && !tracksJson.results[trkNum].isStreamable) {
              trkNum++;
            }

            // If no streamable tracks  
            if (trkNum == tracksJson.resultCount) {
              Promise.reject('No tracks were streamable');
            } else {
              var artistCount = 1;
              var trackCount = 1;
              var artists = tracksJson.results.map(function(track) {
                return track.artistName.toLowerCase();
              }).sort();
              var tracks = tracksJson.results.map(function(track) {
                return track.trackName.toLowerCase();
              }).sort();

              // Determine if the search results are many tracks for an artist OR a specific song title.
              var prevArtist=artists[0];
              var prevTrack=tracks[0];
  
              for (var i=1; i < tracksJson.resultCount;i++) {
                if (artists[i] != prevArtist) {
                  artistCount++;
                  prevArtist = artists[i];
                }
                if (tracks[i] != prevTrack) {
                  trackCount++;
                  prevTrack = tracks[i];
                }  
              }
          
              // If there are at least twice as many track differences that artist differences, then load all of the artist's tracks into the queue, ELSE play just the first track now (iTunes returns the most popular track first) 
              if (trackCount/artistCount > 2) {
                const queueURI = 'x-rincon-queue:' + player.uuid + '#0';
                
                // Filtered list of tracks to play
                var queueTracks = tracksJson.results.reduce(function(tracksArray, track) {
                  if (track.isStreamable) {
                    var skip = false;
  
                    for (var j=0; (j < tracksArray.length) && !skip ; j++) {
                      // Skip duplicate songs
                      skip = (track.trackName == tracksArray[j].trackName);
                    }
                    
                    if (!skip) {
                      var metadataID = METADATA_URI_STARTERS[type] + encodeURIComponent('song:' + track.trackId);
                      var metadata = getMetadata(metadataID, PARENTS[type] + track.trackName.toLowerCase(), CLASSES[type],track.trackName);
                      var uri = uriTemplates[type](encodeURIComponent('song:' + track.trackId));

                      tracksArray.push({trackName:track.trackName, uri:uri, metadata:metadata});
                    }
                  } 
                  return tracksArray;
                }, []);

                return player.coordinator.clearQueue()
                  .then(() => player.coordinator.addURIToQueue(queueTracks[0].uri, queueTracks[0].metadata, true, 1))
                  .then(() => {
                      if (radioOn(player)) {
                        return promise.then(() => player.coordinator.setAVTransport(queueURI,''));
                      }
                    })
                  .then(() => player.coordinator.play())
                  .then(() => {
                    return queueTracks.reduce(function(promise, track, index){
                      if (index > 0) {
                        return promise.then(() => player.coordinator.addURIToQueue(track.uri, track.metadata, true, index + 1));
                      } else {
                        return promise.then(() => {});
                      }   
                    }, Promise.resolve());
                  });
              } else {
                const metadataID = METADATA_URI_STARTERS[type] + encodeURIComponent('song:' + tracksJson.results[trkNum].trackId);
                const metadata = getMetadata(metadataID, PARENTS[type] + tracksJson.results[trkNum].trackName.toLowerCase(), CLASSES[type],tracksJson.results[trkNum].trackName);
                const uri = uriTemplates[type](encodeURIComponent('song:' + tracksJson.results[trkNum].trackId));
                var   empty = false;

                return player.coordinator.getQueue(0,1)
                  .then((queue) => {
                    empty = (queue.numberReturned == 0);
                    nextTrackNo = (empty)?1:player.coordinator.state.trackNo + 1;
                  })
                  .then(() => player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo))
                  .then(() => {
                    if (radioOn(player)) {
                      return promise.then(() => player.coordinator.setAVTransport(queueURI,''));
                    }
                  })
                  .then(() => {
                    if (!empty) {
                      return promise.then(() => player.coordinator.nextTrack());
                    }
                  }) 
                  .then(() => player.coordinator.play());
              }
            }
          }
        });
    }
  } else {
    const metadataID = METADATA_URI_STARTERS[type] + encodeURIComponent(trackID);
    const metadata = getMetadata(metadataID, PARENTS[type], CLASSES[type],'');
    const uri = uriTemplates[type](encodeURIComponent(trackID));

    if (action == 'queue') {
      return player.coordinator.addURIToQueue(uri, metadata);
    } else if (action == 'now') {
      nextTrackNo = player.coordinator.state.trackNo + 1;
      return player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo)
        .then(() => player.coordinator.nextTrack())
        .then(() => player.coordinator.play());
    } else if (action == 'next') {
      nextTrackNo = player.coordinator.state.trackNo + 1;
      return player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo);
    }
  }
}

module.exports = function (api) {
  api.registerAction('applemusic', appleMusic);
};
