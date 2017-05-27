'use strict';
const util = require('util');
const os = require('os');

function createPlaylist(player, values) {
  const playlistName = decodeURIComponent(values[0]);
  return player.coordinator
               .createPlaylist(playlistName)
               .then((res) => {
               		return res;
               	}
               	);
}

function deletePlaylist(player, values) {
  const sqid = decodeURIComponent(values[0]);
  return player.coordinator
               .deletePlaylist(sqid)
               .then((res) => {
               		return res;
               	}
               	);
}

function importPlaylist(player, values) {
  const sqid = decodeURIComponent(values[0]);
  const title = decodeURIComponent(values[1]);
  let uri = values.slice(2).map(x => "/" + x).join().replace(/,/g,'').replace(/\//,'');
  const platform = os.platform();
  let hostname = os.hostname();
  if(platform === 'darwin') {
  	hostname = hostname.replace(/.local$/gi,''); 
  }
  uri = hostname + uri;
  console.log("importPlaylistx:" + sqid + ',uri:' + uri + ',title:' + title);
  return player.coordinator
               .importPlaylist(sqid, uri, title)
               .then((res) => {
               		return res;
               	}
               	);
}

function playlist(player, values) {
  const playlistName = decodeURIComponent(values[0]);
  return player.coordinator
               .replaceWithPlaylist(playlistName)
               .then(() => player.coordinator.play());
}

function exportPlaylist(player, values) {
  var sqid = decodeURIComponent(values[0]);
  return player.coordinator
               .exportPlaylist(sqid)
                       .then((res) => {
          return { 
          	export : res
          	};
        });
}

module.exports = function (api) {
  api.registerAction('playlist', playlist);
  api.registerAction('playlistexport', exportPlaylist);
  api.registerAction('playlistcreate', createPlaylist);
  api.registerAction('playlistdelete', deletePlaylist);
  api.registerAction('playlistimport', importPlaylist);
};
