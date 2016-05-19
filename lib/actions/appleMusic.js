var request = require('request-promise');
var async = require("async");

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
  var metadataID = METADATA_URI_STARTERS[type] + encodeURIComponent(trackID);
  var trkNum = 0;

  var metadata = metadataTemplate.format({
    metadataID: metadataID,
    parentURI: PARENTS[type],
    clazz: CLASSES[type]
  });
  
  var uri = uriTemplates[type].format({id: encodeURIComponent(trackID)});

  if (action == 'queue') {
    if (type == 'name') {
      request({url: "https://itunes.apple.com/search?media=music&limit=50&entity=song&term=" + trackID.split(':')[1],
               json: true})
        .then(function(tracksJson) {
          while ((trkNum < tracksJson.resultCount) && !tracksJson.results[trkNum].isStreamable) {
            trkNum++;
          }

          // There is at least one streamable track  
          if (trkNum < tracksJson.resultCount) {
            var prevArtist = tracksJson.results[trkNum].artistName;
            var prevTrack = tracksJson.results[trkNum].trackName;
            var artistCount = 1;
            var trackCount = 1;
            var artists = tracksJson.results.map(function(track) {
              return track.artistName.toLowerCase();
            });
            var tracks = tracksJson.results.map(function(track) {
              return track.trackName.toLowerCase();
            });
            
            artists.sort();
            tracks.sort();
            
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
              var first = true;
              player.coordinator.removeAllTracksFromQueue(function() {
                trkNum = 0;
                // Add each of the remaining tracks after a delay interval to keep from pounding Sonos
                async.eachSeries(tracksJson.results,
                  function(track,callback) {
                    // Check see if this track is a duplicate of a track that has already been queued and skip it if so
                    if (track.isStreamable) {
                      var found = false;

                      for (var j=0; (j < trkNum) && !found ; j++) {
                        dupe_check = tracksJson.results[j];
                        found = (track.trackName == dupe_check.trackName);
                      }

                      if (!found) {
                        var metadataID = METADATA_URI_STARTERS[type] + encodeURIComponent('song:' + track.trackId);     
                        var metadata = metadataTemplate.format({
                          metadataID: metadataID,
                          parentURI: PARENTS[type],
                          clazz: CLASSES[type]
                        });
                        var uri = uriTemplates[type].format({id: encodeURIComponent('song:' + track.trackId)});

                        if (first) {
                          player.coordinator.addURIToQueue(uri, metadata, true, 1, function (error, res) {
                            if (!error) {
                              //need this to tell sonos to use queue (it may be playing from line in, etc)
                              var queueURI = 'x-rincon-queue:' + player.uuid + '#0';
                              player.setAVTransportURI(queueURI, '', function () {
                                player.coordinator.play(callback);
                              });
                            } else {
                              callback(error);
                            }
                          });
                          first = false;
                        } else {
                          var nextTrackNo = player.coordinator.state.trackNo + 1;
                          player.coordinator.addURIToQueue(uri, metadata, function (error, res) {
                            callback();
                          });
                        }
                      } else {
                        callback();
                      }
                    } else {
                      callback();
                    }
                  },
                  function(err) {
                  });
                  
              });
            } else {
              var track = tracksJson.results[trkNum];
              var metadataID = METADATA_URI_STARTERS[type] + encodeURIComponent('song:' + track.trackId);     
              var metadata = metadataTemplate.format({
                metadataID: metadataID,
                parentURI: PARENTS[type],
                clazz: CLASSES[type]
              });
              var uri = uriTemplates[type].format({id: encodeURIComponent('song:' + track.trackId)});
              var nextTrackNo = player.coordinator.state.trackNo + 1;

              player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo, function (error, res) {
                if (!error) {
                  //need this to tell sonos to use queue (it may be playing from line in, etc)
                  var queueURI = 'x-rincon-queue:' + player.uuid + '#0';
                  player.setAVTransportURI(queueURI, '', function () {
                    player.coordinator.nextTrack(function (error) {
                      player.coordinator.play();
                    });
                  });
                }
              });
            }
          }
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
