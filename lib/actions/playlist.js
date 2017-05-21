'use strict';
const util = require('util');


function createPlaylist(player, values) {
  const playlistName = decodeURIComponent(values[0]);
  return player.coordinator
               .createPlaylist(playlistName)
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

function playlistExport(player, values) {
	var sqid = decodeURIComponent(values[0]);
	console.log("playlistExport sqid:" + sqid);
return player.coordinator
               .exportPlaylist(sqid)
                       .then((res) => {
                       	var dump = res.map((x) => util.inspect(x, false, null) );
                       	console.log("dump xxxxxxxxxx:", dump);
          return { 
          	export : res
          	};
        });
}

module.exports = function (api) {
  api.registerAction('playlist', playlist);
  api.registerAction('playlistexport', playlistExport);
  api.registerAction('createplaylist', createPlaylist);
};
