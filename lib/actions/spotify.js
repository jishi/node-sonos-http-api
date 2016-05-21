var request = require('request');

var metadataTemplate = '<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" ' +
        'xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">' +
        '<item id="00030020{uri}" restricted="true"><upnp:class>object.item.audioItem.musicTrack</upnp:class>' +
        '<desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON3079_X_#Svc3079-0-Token</desc></item></DIDL-Lite>';

function spotify(player, values) {
  var action = values[0];
  var spotifyUri = values[1];
  var encodedSpotifyUri = encodeURIComponent(spotifyUri);

  //check if current uri is either a track or a playlist/album
  if(spotifyUri.startsWith('spotify:track:'))
  {
	var uri = 'x-sonos-spotify:' + encodedSpotifyUri + '?sid=9&flags=32&sn=1';
  }else{
	var uri = 'x-rincon-cpcontainer:0006206c' + encodedSpotifyUri;
  }

  var metadata = metadataTemplate.format({uri: encodedSpotifyUri});
  
  if (action == 'queue') {
    player.coordinator.addURIToQueue(uri, metadata);
  } else if(action == 'now') {

    var nextTrackNo = player.coordinator.state.trackNo + 1;
    player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo, function (error, res) {
      if (!error) {
        player.coordinator.nextTrack(function (error) {
          if (!error) {
            player.coordinator.play();
          }
        });
      } else {
	//console.log(error);
      }
    });
  } else if (action == 'next') {
    var nextTrackNo = player.coordinator.state.trackNo + 1;
    player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo);
  }
}

function spotifySearch(player, values) {
  var baseUrl = 'https://api.spotify.com/v1/';
  var requestUrl = baseUrl + 'search?q=' + values[1] + '&type=' + values[0];

  request(requestUrl, function(error, response, data) {    
    switch(values[0]) {
    case 'track':
      data = JSON.parse(data);
      if(data && data.tracks && data.tracks.items) {
        topTrack = data.tracks.items[0];
        spotify(player, ['now', topTrack.uri]);
      }
    break;
    case 'artist':
      data = JSON.parse(data);
      if(data && data.artists && data.artists.items) {
        topArtist = data.artists.items[0];
	if(!topArtist || !topArtist.id)
          return;
        request(baseUrl + 'artists/' + topArtist.id + '/top-tracks?country=CA', function(error, response, trackData) {
          trackData = JSON.parse(trackData);
          if(trackData && trackData.tracks) {
            for(var i = 0; i < trackData.tracks.length; i++) {
              var track = trackData.tracks[i];
              if(i == 0)
                spotify(player, ['now', track.uri]);
              spotify(player, ['next', track.uri]);
            }
          }
        });
      }
      break;
    }
  });
}

module.exports = function (api) {
  api.registerAction('spotify', spotify);
  api.registerAction('spotifysearch', spotifySearch);
}
