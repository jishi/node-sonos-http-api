const appleDef = require('../music_services/appleDef');
const spotifyDef = require('../music_services/spotifyDef');
const deezerDef = require('../music_services/deezerDef');
const libraryDef = require('../music_services/libraryDef');
const { eliteDef } = require('./musicSearch');

function getService(service) {
  if (service === 'apple') {
    return appleDef;
  } else if (service === 'spotify') {
    return spotifyDef;
  } else if (service === 'deezer') {
    return deezerDef;
  } else if (service === 'elite') {
    return eliteDef;
  } else if (service === 'library') {
    return libraryDef;
  }
}
exports.getService = getService;
