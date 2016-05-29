'use strict';

function isRadioOrLineIn(uri) {
  return uri.startsWith('x-sonosapi-stream:') ||
    uri.startsWith('x-sonosapi-radio:') ||
    uri.startsWith('pndrradio:') ||
    uri.startsWith('x-sonosapi-hls:') ||
    uri.startsWith('x-rincon-stream:') ||
    uri.startsWith('x-sonos-htastream:');
}

module.exports = isRadioOrLineIn;
