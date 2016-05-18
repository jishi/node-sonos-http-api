var request = require('request-promise');

var metadataTemplate = '<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" ' +
        'xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">' +
        '<item id="{metadataID}" parentID="{parentURI}" restricted="true"><upnp:class>object.item.audioItem.{clazz}</upnp:class>' +
        '<desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON52231_X_#Svc52231-0-Token</desc></item></DIDL-Lite>';

var uriTemplates = {
  song: 'x-sonos-http:{id}.mp4?sid=204&flags=8224&sn=4',
  album: 'x-rincon-cpcontainer:0004206c{id}',
  name: 'x-sonos-http:{id}.mp4?sid=204&flags=8224&sn=4'
};

var CLASSES = {
  song: 'musicTrack',
  album: 'musicAlbum',
  name: 'musicTrack'
}

var METADATA_URI_STARTERS = {
  song: '00032020',
  album: '0004206c',
  name: '00032020'
};

var PARENTS = {
  song: '0004206calbum%3a',
  album: '00020000album%3a',
  name: '0004206calbum%3a'
};

function appleMusic(player, values) {
  var action = values[0];
  var trackID = values[1];
  var type = trackID.split(':')[0];
  var metadataID = METADATA_URI_STARTERS[type] + (((type=='song')||(type=='album'))?encodeURIComponent(trackID):'');

  var metadata = metadataTemplate.format({
    metadataID: metadataID,
    parentURI: PARENTS[type],
    clazz: CLASSES[type]
  });
  
  var uri = uriTemplates[type].format({id: encodeURIComponent(trackID)});

  var addTrackToQueue = function (track, playNow) {
     var metadataID = METADATA_URI_STARTERS[type] + encodeURIComponent('song:' + track.trackId);     

     var metadata = metadataTemplate.format({
       metadataID: metadataID,
       parentURI: PARENTS[type],
       clazz: CLASSES[type]
     });
            
     var uri = uriTemplates[type].format({id: encodeURIComponent('song:' + track.trackId)});

     if (playNow) {
       var nextTrackNo = player.coordinator.state.trackNo + 1;
       player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo, function (error, res) {
         if (!error) {
           //need this to tell sonos to use queue (it may be playing from line in, etc)
           var queueURI = 'x-rincon-queue:' + player.uuid + '#0';
           player.setAVTransportURI(queueURI, '', function (error) {
             if (!error) {
               if (nextTrackNo > 1) {
                 player.coordinator.nextTrack(function (error) {
                   player.coordinator.play();
                 });
               } else {
                 player.coordinator.play();
               }
             } else {
               callback(error);
             }
           });
         }
       });
     } else {
       player.coordinator.addURIToQueue(uri, metadata);
     }
  }

  if (action == 'queue') {
    if (type == 'name') {
      request({url: "https://itunes.apple.com/search?media=music&limit=50&entity=song&term=" + trackID.split(':')[1],
               json: true})
        .then(function(tracksJson) {
          var trkNum; 
          for (trkNum=0;(trkNum < tracksJson.resultCount) && !tracksJson.results[trkNum].isStreamable ;trkNum++) {
          }

          // There is at least one streamable track  
          if (trkNum < tracksJson.resultCount) {
            var prevArtist = tracksJson.results[trkNum].artistName;
            var prevTrack = tracksJson.results[trkNum].trackName;
            var artistCount = 1;
            var trackCount = 1;
            
            // Determine if the search results are many tracks for an artist OR a specific song title.
            for (var i=trkNum; i < tracksJson.resultCount;i++) {
              var track = tracksJson.results[i];
              
              if (track.artistName != prevArtist) {
                artistCount++;
                prevArtist = track.artistName;
              }
              if (track.trackName != prevTrack) {
                trackCount++;
                prevTrack = track.trackName;
              }  
            }
          
            // If there are more track differences that artist differences, then load all of the artist's tracks into the queue, ELSE play just the first track now (iTunes returns the most popular track first) 
            if (trackCount > artistCount) {
              player.coordinator.removeAllTracksFromQueue(function() {
                // Add the first track and start it playing
                addTrackToQueue(tracksJson.results[trkNum], true);
                
                // Add each of the remaining tracks after a delay interval to keep from pounding Sonos
                var intervalID = setInterval(function() {
                  // Check see if this track is a duplicate of a track that has already been queued and skip it if so
                  var found = false;
                  do {
                    for (++trkNum;(trkNum < tracksJson.resultCount) && !tracksJson.results[trkNum].isStreamable ;trkNum++) {
                    }
                    if (trkNum < tracksJson.resultCount) {
                      var track = tracksJson.results[trkNum];
                      found = false; 
                      for (var j=0; (j < trkNum) && !found ; j++) {
                        dupe_check = tracksJson.results[j];
                        found = (track.trackName == dupe_check.trackName);
                      }
                    }
                  } while ((trkNum < tracksJson.resultCount) && found);   

                  if (trkNum < tracksJson.resultCount) {
                    addTrackToQueue(tracksJson.results[trkNum], false);
                  } else {
                    // Finished, so stop the repeated intervals
                    clearInterval(intervalID);
                  }
                }, 500); // Pause a half second between adding tracks
              });
            } else {
              addTrackToQueue(tracksJson.results[trkNum], true);
            }
          }
        })
        .catch(function (err) {
          console.error('Could not reach iTunes for some reason');
          console.error(err.message);
        });
    } else {
      player.coordinator.addURIToQueue(uri, metadata);
    }
  } else if(action == 'now') {
    var nextTrackNo = player.coordinator.state.trackNo + 1;
    player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo, function (error, res) {
      if (!error) {
        player.coordinator.nextTrack(function (error) {
          if (!error) {
            player.coordinator.play();
          }
        });
      }
    });
  } else if (action == 'next') {
    var nextTrackNo = player.coordinator.state.trackNo + 1;
    player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo);
  }
}

module.exports = function (api) {
  api.registerAction('applemusic', appleMusic);
}
