'use strict';
const sleep = require('system-sleep');

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
  if (values.body !== undefined) {
  	const items = values.body.export;
  	const p = Promise.resolve()
  	return p.then(_ => {
		items.map(item => {
			const title = item.title;
			const uri = item.uri;
			// there is no way to batch import in Controller UI, we must import one by one
			// and since adding requires a synchronous browse for index update, we block
			// 1000 should be long enough, tested on WiFi + play:5
  			sleep(1000);
			return player.coordinator.importPlaylist(sqid, uri, title);
		});
  	}).then((res) => {
  		return res;
  	});
  	// TODO fail (ex: wrong sqid), timeout, document batch post
  }
  else {
  	  const title = decodeURIComponent(values[1]);
  	  const uri = values.slice(2).map(x => "/" + x).join().replace(/,/g,'').replace(/\//,'');
	  return player.coordinator
	               .importPlaylist(sqid, uri, title)
	               .then((res) => {
	               		return res;
	               	}
	               	);  	
  }
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
