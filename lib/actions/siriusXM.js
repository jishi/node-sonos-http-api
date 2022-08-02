'use strict';
const request = require('request-promise');
const Fuse = require('fuse.js');
const channels = require('../sirius-channels.json');

function getSiriusXmMetadata(id, parent, title) {
  return `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/"
        xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
        <item id="00092120r%3a${id}" parentID="${parent}" restricted="true"><dc:title>${title}</dc:title><upnp:class>object.item.audioItem.audioBroadcast</upnp:class>
        <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">_</desc></item></DIDL-Lite>`;
}

function getSiriusXmUri(id) {
  return `x-sonosapi-hls:r%3a${id}?sid=37&flags=8480&sn=11`;
}

const replaceArray = ['ñ|n','á|a','ó|o','è|e','ë|e','/| ','-| ','siriusxm|sirius XM','sxm|SXM','cnn|CNN','hln|HLN','msnbc|MSNBC','bbc|BBC',
                    'ici|ICI','prx|PRX','cbc|CBC','npr|NPR','espn|ESPN',' ny| NY','kiis|KIIS','&|and','ami|AMI','z1|Z1','2k|2K','bb |BB '];

function adjustStation(name) {
  name = name.toLowerCase();
  for (var i=0;i < replaceArray.length;i++)
    name = name.replace(replaceArray[i].split('|')[0],replaceArray[i].split('|')[1]);

  return name;
}

function siriusXM(player, values) {
  var auth = '';
  var results = [];

  // Used to generate channel data for the channels array. Results are sent to the console after loading Sonos Favorites with a number of SiriusXM Channels 
  if (values[0] == 'data') {
    return player.system.getFavorites()
    .then((favorites) => {
      return favorites.reduce(function(promise, item) {
        if (item.uri.startsWith('x-sonosapi-hls:')) {
          var title = item.title.replace("'",'');

          console.log("{fullTitle:'" + title +
                      "', channelNum:'" + title.substring(0,title.search(' - ')) +
                      "', title:'" + title.substring(title.search(' - ')+3,title.length) +
                      "', id:'" + item.uri.substring(item.uri.search('r%3a') + 4,item.uri.search('sid=')-1) +
                      "', parentID:'" + item.metadata.substring(item.metadata.search('parentID=') + 10,item.metadata.search(' restricted')-1) + "'},");
        }
        return promise;
      }, Promise.resolve("success"));
    });
  } else
  // Used to send a list of channel numbers specified below in channels for input into an Alexa slot
  if (values[0] == 'channels') {
    var cList = channels.map(function(channel) {
      return channel.channelNum;
    });
    cList.sort(function(a,b) {return a-b;}).map(function(channel) {
      console.log(channel);
    });

    return Promise.resolve("success");
  } else
  // Used to send a list of station titles specified below in channels for input into an Alexa slot
  if (values[0] == 'stations') {
    var sList = channels.map(function(channel){
      console.log(adjustStation(channel.title));
    });
    return Promise.resolve("success");
  } else {
  // Play the specified SiriusXM channel or station
    var searchVal = values[0];
    var fuzzy = new Fuse(channels, { keys: ["channelNum", "title"] });

    results = fuzzy.search(searchVal);
    if (results.length > 0) {
      const channel = results[0];
      const uri = getSiriusXmUri(channel.item.id);
      const metadata = getSiriusXmMetadata(channel.item.id, channel.item.parentID, channel.item.fullTitle);

      return player.coordinator.setAVTransport(uri, metadata)
        .then(() => player.coordinator.play());
    }
  }
}

module.exports = function (api) {
  api.registerAction('siriusxm', siriusXM);
};
