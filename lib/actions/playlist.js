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
			// since adding requires a synchronous browse for index update, we block
			// block should be long enough, tested on WiFi + play:5
  			sleep(500);
			return player.coordinator.importPlaylist(sqid, uri, title);
		});
  	}).then((res) => {
  		return res;
  	}).catch((err) => {
  		throw new Error(err);
  	});
  	// TODO timeout, document batch post postman/curl
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
