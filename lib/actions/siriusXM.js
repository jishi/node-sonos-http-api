var Fuse = require('Fuse');


function getSiriusXmMetadata(id, parent, title, auth) {
  return `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/"
        xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
        <item id="00092120r%3a${id}" parentID="${parent}" restricted="true"><dc:title>${title}</dc:title><upnp:class>object.item.audioItem.audioBroadcast</upnp:class>
        <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON${auth}</desc></item></DIDL-Lite>`;
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
  
    // Find SiriusXM User ID in a favorite.  There has to be at least one Sonos Favorite that is an SiriusXM station       
    return player.system.getFavorites()
    .then((favorites) => {
      return favorites.reduce(function(promise, item){
        if ((auth=='') && item.uri.startsWith('x-sonosapi-hls:')) {
          auth = item.metadata.substring(item.metadata.search('SA_RINCON') + 9,item.metadata.search('</desc>'));
        }
        return promise; 
      }, Promise.resolve());
    })
    .then(() => {
      if (auth != '') {
        var searchVal = values[0];
        var fuzzy = new Fuse(channels, { keys: ["channelNum", "title"] });
    
        results = fuzzy.search(searchVal);
        if (results.length > 0) {
          const channel = results[0];
          const uri = getSiriusXmUri(channel.id);
          const metadata = getSiriusXmMetadata(channel.id, channel.parentID, channel.fullTitle, auth);
        
          return player.coordinator.setAVTransport(uri, metadata) 
            .then(() => player.coordinator.play());
        }
      }
    });
  }
}

var channels = [
{fullTitle:'10 - Pop2K', channelNum:'10', title:'Pop2K', id:'8208', parentID:'00070044g%3apop'},
{fullTitle:'13 - Velvet', channelNum:'13', title:'Velvet', id:'9361', parentID:'00070044g%3apop'},
{fullTitle:'14 - The Coffee House', channelNum:'14', title:'The Coffee House', id:'coffeehouse', parentID:'00070044g%3apop'},
{fullTitle:'15 - The Pulse', channelNum:'15', title:'The Pulse', id:'thepulse', parentID:'00070044g%3apop'},
{fullTitle:'158 - Caliente', channelNum:'158', title:'Caliente', id:'rumbon', parentID:'00070044g%3apop'},
{fullTitle:'16 - The Blend', channelNum:'16', title:'The Blend', id:'starlite', parentID:'00070044g%3apop'},
{fullTitle:'17 - SiriusXM Love', channelNum:'17', title:'SiriusXM Love', id:'siriuslove', parentID:'00070044g%3apop'},
{fullTitle:'18 - SXM Limited Edition', channelNum:'18', title:'SXM Limited Edition', id:'9138', parentID:'00070044g%3apop'},
{fullTitle:'2 - SiriusXM Hits 1', channelNum:'2', title:'SiriusXM Hits 1', id:'siriushits1', parentID:'00070044g%3apop'},
{fullTitle:'3 - Venus', channelNum:'3', title:'Venus', id:'9389', parentID:'00070044g%3apop'},
{fullTitle:'300 - Poptropolis', channelNum:'300', title:'Poptropolis', id:'9412', parentID:'00070044g%3apop'},
{fullTitle:'301 - Road Trip Radio', channelNum:'301', title:'Road Trip Radio', id:'9415', parentID:'00070044g%3apop'},
{fullTitle:'302 - The Covers Channel', channelNum:'302', title:'The Covers Channel', id:'9416', parentID:'00070044g%3apop'},
{fullTitle:'4 - Pitbulls Globalization', channelNum:'4', title:'Pitbulls Globalization', id:'9406', parentID:'00070044g%3apop'},
{fullTitle:'5 - 50s on 5', channelNum:'5', title:'50s on 5', id:'siriusgold', parentID:'00070044g%3apop'},
{fullTitle:'6 - 60s on 6', channelNum:'6', title:'60s on 6', id:'60svibrations', parentID:'00070044g%3apop'},
{fullTitle:'7 - 70s on 7', channelNum:'7', title:'70s on 7', id:'totally70s', parentID:'00070044g%3apop'},
{fullTitle:'700 - Neil Diamond Radio', channelNum:'700', title:'Neil Diamond Radio', id:'8372', parentID:'00070044g%3apop'},
{fullTitle:'703 - Elevations', channelNum:'703', title:'Elevations', id:'9362', parentID:'00070044g%3apop'},
{fullTitle:'8 - 80s on 8', channelNum:'8', title:'80s on 8', id:'big80s', parentID:'00070044g%3apop'},
{fullTitle:'9 - 90s on 9', channelNum:'9', title:'90s on 9', id:'8206', parentID:'00070044g%3apop'},
{fullTitle:'19 - Elvis Radio', channelNum:'19', title:'Elvis Radio', id:'elvisradio', parentID:'00070044g%3arock'},
{fullTitle:'20 - E Street Radio', channelNum:'20', title:'E Street Radio', id:'estreetradio', parentID:'00070044g%3arock'},
{fullTitle:'21 - Underground Garage', channelNum:'21', title:'Underground Garage', id:'undergroundgarage', parentID:'00070044g%3arock'},
{fullTitle:'22 - Pearl Jam Radio', channelNum:'22', title:'Pearl Jam Radio', id:'8370', parentID:'00070044g%3arock'},
{fullTitle:'23 - Grateful Dead', channelNum:'23', title:'Grateful Dead', id:'gratefuldead', parentID:'00070044g%3arock'},
{fullTitle:'24 - Radio Margaritaville', channelNum:'24', title:'Radio Margaritaville', id:'radiomargaritaville', parentID:'00070044g%3arock'},
{fullTitle:'25 - Classic Rewind', channelNum:'25', title:'Classic Rewind', id:'classicrewind', parentID:'00070044g%3arock'},
{fullTitle:'26 - Classic Vinyl', channelNum:'26', title:'Classic Vinyl', id:'classicvinyl', parentID:'00070044g%3arock'},
{fullTitle:'27 - Deep Tracks', channelNum:'27', title:'Deep Tracks', id:'thevault', parentID:'00070044g%3arock'},
{fullTitle:'28 - The Spectrum', channelNum:'28', title:'The Spectrum', id:'thespectrum', parentID:'00070044g%3arock'},
{fullTitle:'29 - Jam_ON', channelNum:'29', title:'Jam_ON', id:'jamon', parentID:'00070044g%3arock'},
{fullTitle:'30 - The Loft', channelNum:'30', title:'The Loft', id:'8207', parentID:'00070044g%3arock'},
{fullTitle:'31 - Tom Petty Radio', channelNum:'31', title:'Tom Petty Radio', id:'9407', parentID:'00070044g%3arock'},
{fullTitle:'310 - SXM Rock Hall Radio', channelNum:'310', title:'SXM Rock Hall Radio', id:'9174', parentID:'00070044g%3arock'},
{fullTitle:'312 - Pettys Buried Treasure', channelNum:'312', title:'Pettys Buried Treasure', id:'9352', parentID:'00070044g%3arock'},
{fullTitle:'313 - RockBar', channelNum:'313', title:'RockBar', id:'9175', parentID:'00070044g%3arock'},
{fullTitle:'314 - SiriusXM Turbo', channelNum:'314', title:'SiriusXM Turbo', id:'9413', parentID:'00070044g%3arock'},
{fullTitle:'316 - SiriusXM Comes Alive!', channelNum:'316', title:'SiriusXM Comes Alive!', id:'9176', parentID:'00070044g%3arock'},
{fullTitle:'32 - The Bridge', channelNum:'32', title:'The Bridge', id:'thebridge', parentID:'00070044g%3arock'},
{fullTitle:'33 - 1st Wave', channelNum:'33', title:'1st Wave', id:'firstwave', parentID:'00070044g%3arock'},
{fullTitle:'34 - Lithium', channelNum:'34', title:'Lithium', id:'90salternative', parentID:'00070044g%3arock'},
{fullTitle:'35 - SiriusXMU', channelNum:'35', title:'SiriusXMU', id:'leftofcenter', parentID:'00070044g%3arock'},
{fullTitle:'36 - Alt Nation', channelNum:'36', title:'Alt Nation', id:'altnation', parentID:'00070044g%3arock'},
{fullTitle:'37 - Octane', channelNum:'37', title:'Octane', id:'octane', parentID:'00070044g%3arock'},
{fullTitle:'38 - Ozzys Boneyard', channelNum:'38', title:'Ozzys Boneyard', id:'buzzsaw', parentID:'00070044g%3arock'},
{fullTitle:'39 - Hair Nation', channelNum:'39', title:'Hair Nation', id:'hairnation', parentID:'00070044g%3arock'},
{fullTitle:'40 - Liquid Metal', channelNum:'40', title:'Liquid Metal', id:'hardattack', parentID:'00070044g%3arock'},
{fullTitle:'41 - Faction', channelNum:'41', title:'Faction', id:'faction', parentID:'00070044g%3arock'},
{fullTitle:'42 - The Joint', channelNum:'42', title:'The Joint', id:'reggaerhythms', parentID:'00070044g%3arock'},
{fullTitle:'713 - Jason Ellis', channelNum:'713', title:'Jason Ellis', id:'9363', parentID:'00070044g%3arock'},
{fullTitle:'330 - SiriusXM Silk', channelNum:'330', title:'SiriusXM Silk', id:'9364', parentID:'00070044g%3arandb'},
{fullTitle:'340 - Tiëstos Club Life Radio', channelNum:'340', title:'Tiëstos Club Life Radio', id:'9219', parentID:'00070044g%3adance'},
{fullTitle:'350 - Red White & Booze', channelNum:'350', title:'Red White & Booze', id:'9178', parentID:'00070044g%3acountry'},
{fullTitle:'43 - Backspin', channelNum:'43', title:'Backspin', id:'8124', parentID:'00070044g%3ahiphop'},
{fullTitle:'44 - Hip-Hop Nation', channelNum:'44', title:'Hip-Hop Nation', id:'hiphopnation', parentID:'00070044g%3ahiphop'},
{fullTitle:'45 - Shade 45', channelNum:'45', title:'Shade 45', id:'shade45', parentID:'00070044g%3ahiphop'},
{fullTitle:'46 - The Heat', channelNum:'46', title:'The Heat', id:'hotjamz', parentID:'00070044g%3arandb'},
{fullTitle:'47 - SiriusXM FLY', channelNum:'47', title:'SiriusXM FLY', id:'9339', parentID:'00070044g%3arandb'},
{fullTitle:'48 - Heart & Soul', channelNum:'48', title:'Heart & Soul', id:'heartandsoul', parentID:'00070044g%3arandb'},
{fullTitle:'49 - Soul Town', channelNum:'49', title:'Soul Town', id:'soultown', parentID:'00070044g%3arandb'},
{fullTitle:'50 - The Groove', channelNum:'50', title:'The Groove', id:'8228', parentID:'00070044g%3arandb'},
{fullTitle:'51 - BPM', channelNum:'51', title:'BPM', id:'thebeat', parentID:'00070044g%3adance'},
{fullTitle:'52 - Electric Area', channelNum:'52', title:'Electric Area', id:'area33', parentID:'00070044g%3adance'},
{fullTitle:'53 - SiriusXM Chill', channelNum:'53', title:'SiriusXM Chill', id:'chill', parentID:'00070044g%3adance'},
{fullTitle:'54 - Studio 54 Radio', channelNum:'54', title:'Studio 54 Radio', id:'9145', parentID:'00070044g%3adance'},
{fullTitle:'55 - Utopia', channelNum:'55', title:'Utopia', id:'9365', parentID:'00070044g%3adance'},
{fullTitle:'56 - The Highway', channelNum:'56', title:'The Highway', id:'newcountry', parentID:'00070044g%3acountry'},
{fullTitle:'57 - Y2Kountry', channelNum:'57', title:'Y2Kountry', id:'9340', parentID:'00070044g%3acountry'},
{fullTitle:'58 - Prime Country', channelNum:'58', title:'Prime Country', id:'primecountry', parentID:'00070044g%3acountry'},
{fullTitle:'59 - Willies Roadhouse', channelNum:'59', title:'Willies Roadhouse', id:'theroadhouse', parentID:'00070044g%3acountry'},
{fullTitle:'60 - Outlaw Country', channelNum:'60', title:'Outlaw Country', id:'outlawcountry', parentID:'00070044g%3acountry'},
{fullTitle:'61 - Bluegrass Junction', channelNum:'61', title:'Bluegrass Junction', id:'bluegrass', parentID:'00070044g%3acountry'},
{fullTitle:'62 - No Shoes Radio', channelNum:'62', title:'No Shoes Radio', id:'9418', parentID:'00070044g%3acountry'},
{fullTitle:'715 - SXM Limited Edition 2', channelNum:'715', title:'SXM Limited Edition 2', id:'9139', parentID:'00070044g%3arock'},
{fullTitle:'716 - SXM Limited Edition 3', channelNum:'716', title:'SXM Limited Edition 3', id:'9353', parentID:'00070044g%3arock'},
{fullTitle:'720 - Sways Universe', channelNum:'720', title:'Sways Universe', id:'9397', parentID:'00070044g%3ahiphop'},
{fullTitle:'721 - SXM Limited Edition 4', channelNum:'721', title:'SXM Limited Edition 4', id:'9398', parentID:'00070044g%3ahiphop'},
{fullTitle:'726 - SXM Limited Edition 5', channelNum:'726', title:'SXM Limited Edition 5', id:'9399', parentID:'00070044g%3arandb'},
{fullTitle:'730 - SXM Limited Edition 6', channelNum:'730', title:'SXM Limited Edition 6', id:'9400', parentID:'00070044g%3adance'},
{fullTitle:'741 - The Village', channelNum:'741', title:'The Village', id:'8227', parentID:'00070044g%3acountry'},
{fullTitle:'63 - The Message', channelNum:'63', title:'The Message', id:'spirit', parentID:'00070044g%3achristian'},
{fullTitle:'64 - Kirk Franklins Praise', channelNum:'64', title:'Kirk Franklins Praise', id:'praise', parentID:'00070044g%3achristian'},
{fullTitle:'65 - enLighten', channelNum:'65', title:'enLighten', id:'8229', parentID:'00070044g%3achristian'},
{fullTitle:'66 - Watercolors', channelNum:'66', title:'Watercolors', id:'jazzcafe', parentID:'00070044g%3ajazz'},
{fullTitle:'67 - Real Jazz', channelNum:'67', title:'Real Jazz', id:'purejazz', parentID:'00070044g%3ajazz'},
{fullTitle:'68 - Spa', channelNum:'68', title:'Spa', id:'spa73', parentID:'00070044g%3ajazz'},
{fullTitle:'69 - Escape', channelNum:'69', title:'Escape', id:'8215', parentID:'00070044g%3ajazz'},
{fullTitle:'70 - BB Kings Bluesville', channelNum:'70', title:'BB Kings Bluesville', id:'siriusblues', parentID:'00070044g%3ajazz'},
{fullTitle:'71 - Siriusly Sinatra', channelNum:'71', title:'Siriusly Sinatra', id:'siriuslysinatra', parentID:'00070044g%3ajazz'},
{fullTitle:'72 - On Broadway', channelNum:'72', title:'On Broadway', id:'broadwaysbest', parentID:'00070044g%3ajazz'},
{fullTitle:'73 - 40s Junction', channelNum:'73', title:'40s Junction', id:'8205', parentID:'00070044g%3ajazz'},
{fullTitle:'74 - Met Opera Radio', channelNum:'74', title:'Met Opera Radio', id:'metropolitanopera', parentID:'00070044g%3aclassical'},
{fullTitle:'742 - SXM Limited Edition 7', channelNum:'742', title:'SXM Limited Edition 7', id:'9401', parentID:'00070044g%3acountry'},
{fullTitle:'745 - SXM Limited Edition 8', channelNum:'745', title:'SXM Limited Edition 8', id:'9402', parentID:'00070044g%3achristian'},
{fullTitle:'750 - Cinemagic', channelNum:'750', title:'Cinemagic', id:'8211', parentID:'00070044g%3ajazz'},
{fullTitle:'751 - Krishna Das Yoga Radio', channelNum:'751', title:'Krishna Das Yoga Radio', id:'9179', parentID:'00070044g%3ajazz'},
{fullTitle:'752 - SXM Limited Edition 9', channelNum:'752', title:'SXM Limited Edition 9', id:'9403', parentID:'00070044g%3ajazz'},
{fullTitle:'755 - SiriusXM Pops', channelNum:'755', title:'SiriusXM Pops', id:'siriuspops', parentID:'00070044g%3aclassical'},
{fullTitle:'756 - SXM Limited Edition 10', channelNum:'756', title:'SXM Limited Edition 10', id:'9404', parentID:'00070044g%3aclassical'},
{fullTitle:'76 - Symphony Hall', channelNum:'76', title:'Symphony Hall', id:'symphonyhall', parentID:'00070044g%3aclassical'},
{fullTitle:'761 - Águila', channelNum:'761', title:'Águila', id:'9186', parentID:'00070044g%3aworld'},
{fullTitle:'762 - Caricia', channelNum:'762', title:'Caricia', id:'9188', parentID:'00070044g%3aworld'},
{fullTitle:'763 - Viva', channelNum:'763', title:'Viva', id:'8225', parentID:'00070044g%3aworld'},
{fullTitle:'764 - Latidos', channelNum:'764', title:'Latidos', id:'9187', parentID:'00070044g%3aworld'},
{fullTitle:'765 - Flow Nación', channelNum:'765', title:'Flow Nación', id:'9185', parentID:'00070044g%3aworld'},
{fullTitle:'766 - Luna', channelNum:'766', title:'Luna', id:'9189', parentID:'00070044g%3aworld'},
{fullTitle:'767 - Rumbón', channelNum:'767', title:'Rumbón', id:'9190', parentID:'00070044g%3aworld'},
{fullTitle:'768 - La Kueva', channelNum:'768', title:'La Kueva', id:'9191', parentID:'00070044g%3aworld'},
{fullTitle:'157 - ESPN Deportes', channelNum:'157', title:'ESPN Deportes', id:'espndeportes', parentID:'00070044g%3asportstalk'},
{fullTitle:'207 - SiriusXM NBA Radio', channelNum:'207', title:'SiriusXM NBA Radio', id:'9385', parentID:'00070044g%3asportstalk'},
{fullTitle:'208 - SiriusXM PGA TOUR Radio', channelNum:'208', title:'SiriusXM PGA TOUR Radio', id:'8186', parentID:'00070044g%3asportstalk'},
{fullTitle:'209 - MLB Network Radio', channelNum:'209', title:'MLB Network Radio', id:'8333', parentID:'00070044g%3asportstalk'},
{fullTitle:'210 - SXM Fantasy Sports Radio', channelNum:'210', title:'SXM Fantasy Sports Radio', id:'8368', parentID:'00070044g%3asportstalk'},
{fullTitle:'370 - SportsCenter', channelNum:'370', title:'SportsCenter', id:'9180', parentID:'00070044g%3asportstalk'},
{fullTitle:'770 - 70s/80s Pop', channelNum:'770', title:'70s/80s Pop', id:'9372', parentID:'00070044g%3aparty'},
{fullTitle:'771 - 80s/90s Pop', channelNum:'771', title:'80s/90s Pop', id:'9373', parentID:'00070044g%3aparty'},
{fullTitle:'772 - 90s/2K Pop', channelNum:'772', title:'90s/2K Pop', id:'9374', parentID:'00070044g%3aparty'},
{fullTitle:'773 - Classic Rock Party', channelNum:'773', title:'Classic Rock Party', id:'9375', parentID:'00070044g%3aparty'},
{fullTitle:'774 - Rockin Frat Party', channelNum:'774', title:'Rockin Frat Party', id:'9376', parentID:'00070044g%3aparty'},
{fullTitle:'775 - Hip-Hop Party', channelNum:'775', title:'Hip-Hop Party', id:'9377', parentID:'00070044g%3aparty'},
{fullTitle:'776 - Oldies Party', channelNum:'776', title:'Oldies Party', id:'9378', parentID:'00070044g%3aparty'},
{fullTitle:'777 - Pop Party Mix', channelNum:'777', title:'Pop Party Mix', id:'9379', parentID:'00070044g%3aparty'},
{fullTitle:'778 - Punk Party', channelNum:'778', title:'Punk Party', id:'9380', parentID:'00070044g%3aparty'},
{fullTitle:'779 - New Wave Dance Party', channelNum:'779', title:'New Wave Dance Party', id:'9381', parentID:'00070044g%3aparty'},
{fullTitle:'780 - The Girls Room', channelNum:'780', title:'The Girls Room', id:'9382', parentID:'00070044g%3aparty'},
{fullTitle:'781 - Holly', channelNum:'781', title:'Holly', id:'9343', parentID:'00070044g%3aparty'},
{fullTitle:'80 - ESPN Radio', channelNum:'80', title:'ESPN Radio', id:'espnradio', parentID:'00070044g%3asportstalk'},
{fullTitle:'81 - ESPN Xtra', channelNum:'81', title:'ESPN Xtra', id:'8254', parentID:'00070044g%3asportstalk'},
{fullTitle:'82 - Mad Dog Sports Radio', channelNum:'82', title:'Mad Dog Sports Radio', id:'8213', parentID:'00070044g%3asportstalk'},
{fullTitle:'83 - Bleacher Report Radio', channelNum:'83', title:'Bleacher Report Radio', id:'9395', parentID:'00070044g%3asportstalk'},
{fullTitle:'84 - College Sports Nation', channelNum:'84', title:'College Sports Nation', id:'siriussportsaction', parentID:'00070044g%3asportstalk'},
{fullTitle:'85 - SiriusXM FC', channelNum:'85', title:'SiriusXM FC', id:'9341', parentID:'00070044g%3asportstalk'},
{fullTitle:'88 - SiriusXM NFL Radio', channelNum:'88', title:'SiriusXM NFL Radio', id:'siriusnflradio', parentID:'00070044g%3asportstalk'},
{fullTitle:'90 - SiriusXM NASCAR Radio', channelNum:'90', title:'SiriusXM NASCAR Radio', id:'siriusnascarradio', parentID:'00070044g%3asportstalk'},
{fullTitle:'91 - SXM NHL Network Radio', channelNum:'91', title:'SXM NHL Network Radio', id:'8185', parentID:'00070044g%3asportstalk'},
{fullTitle:'93 - SiriusXM Rush', channelNum:'93', title:'SiriusXM Rush', id:'8230', parentID:'00070044g%3asportstalk'},
{fullTitle:'100 - Howard 100', channelNum:'100', title:'Howard 100', id:'howardstern100', parentID:'00070044g%3ahowardstern'},
{fullTitle:'101 - Howard 101', channelNum:'101', title:'Howard 101', id:'howardstern101', parentID:'00070044g%3ahowardstern'},
{fullTitle:'112 - CNBC', channelNum:'112', title:'CNBC', id:'cnbc', parentID:'00070044g%3apublicradio'},
{fullTitle:'113 - FOX Business', channelNum:'113', title:'FOX Business', id:'9369', parentID:'00070044g%3apublicradio'},
{fullTitle:'114 - FOX News Channel', channelNum:'114', title:'FOX News Channel', id:'foxnewschannel', parentID:'00070044g%3apublicradio'},
{fullTitle:'115 - FOX News Headlines 24/7', channelNum:'115', title:'FOX News Headlines 24/7', id:'9410', parentID:'00070044g%3apublicradio'},
{fullTitle:'116 - CNN', channelNum:'116', title:'CNN', id:'cnn', parentID:'00070044g%3apublicradio'},
{fullTitle:'117 - HLN', channelNum:'117', title:'HLN', id:'cnnheadlinenews', parentID:'00070044g%3apublicradio'},
{fullTitle:'118 - MSNBC', channelNum:'118', title:'MSNBC', id:'8367', parentID:'00070044g%3apublicradio'},
{fullTitle:'119 - Bloomberg Radio', channelNum:'119', title:'Bloomberg Radio', id:'bloombergradio', parentID:'00070044g%3apublicradio'},
{fullTitle:'120 - BBC World Service', channelNum:'120', title:'BBC World Service', id:'bbcworld', parentID:'00070044g%3apublicradio'},
{fullTitle:'121 - SiriusXM Insight', channelNum:'121', title:'SiriusXM Insight', id:'8183', parentID:'00070044g%3apublicradio'},
{fullTitle:'122 - NPR Now', channelNum:'122', title:'NPR Now', id:'nprnow', parentID:'00070044g%3apublicradio'},
{fullTitle:'123 - PRX Public Radio', channelNum:'123', title:'PRX Public Radio', id:'8239', parentID:'00070044g%3apublicradio'},
{fullTitle:'124 - POTUS Politics', channelNum:'124', title:'POTUS Politics', id:'indietalk', parentID:'00070044g%3apolitical'},
{fullTitle:'125 - SiriusXM Patriot', channelNum:'125', title:'SiriusXM Patriot', id:'siriuspatriot', parentID:'00070044g%3apolitical'},
{fullTitle:'126 - SiriusXM Urban View', channelNum:'126', title:'SiriusXM Urban View', id:'8238', parentID:'00070044g%3apolitical'},
{fullTitle:'127 - SiriusXM Progress', channelNum:'127', title:'SiriusXM Progress', id:'siriusleft', parentID:'00070044g%3apolitical'},
{fullTitle:'147 - RURAL Radio', channelNum:'147', title:'RURAL Radio', id:'9367', parentID:'00070044g%3apublicradio'},
{fullTitle:'155 - CNN en Español', channelNum:'155', title:'CNN en Español', id:'cnnespanol', parentID:'00070044g%3apublicradio'},
{fullTitle:'169 - CBC Radio One', channelNum:'169', title:'CBC Radio One', id:'cbcradioone', parentID:'00070044g%3apublicradio'},
{fullTitle:'450 - FOX News Talk', channelNum:'450', title:'FOX News Talk', id:'9370', parentID:'00070044g%3apolitical'},
{fullTitle:'455 - C-SPAN Radio', channelNum:'455', title:'C-SPAN Radio', id:'8237', parentID:'00070044g%3apublicradio'},
{fullTitle:'77 - KIDZ BOP Radio', channelNum:'77', title:'KIDZ BOP Radio', id:'9366', parentID:'00070044g%3akids'},
{fullTitle:'78 - Kids Place Live', channelNum:'78', title:'Kids Place Live', id:'8216', parentID:'00070044g%3akids'},
{fullTitle:'79 - Radio Disney', channelNum:'79', title:'Radio Disney', id:'radiodisney', parentID:'00070044g%3akids'},
{fullTitle:'795 - France 24', channelNum:'795', title:'France 24', id:'9417', parentID:'00070044g%3apublicradio'},
{fullTitle:'796 - TheBlaze Radio Network', channelNum:'796', title:'TheBlaze Radio Network', id:'9355', parentID:'00070044g%3apolitical'},
{fullTitle:'797 - SiriusXM Patriot Plus', channelNum:'797', title:'SiriusXM Patriot Plus', id:'8235', parentID:'00070044g%3apolitical'},
{fullTitle:'798 - SiriusXM Progress Plus', channelNum:'798', title:'SiriusXM Progress Plus', id:'9137', parentID:'00070044g%3apolitical'},
{fullTitle:'102 - Radio Andy', channelNum:'102', title:'Radio Andy', id:'9409', parentID:'00070044g%3aentertainment'},
{fullTitle:'105 - EW Radio', channelNum:'105', title:'EW Radio', id:'9351', parentID:'00070044g%3aentertainment'},
{fullTitle:'106 - SiriusXM 106', channelNum:'106', title:'SiriusXM 106', id:'siriusoutq', parentID:'00070044g%3aentertainment'},
{fullTitle:'108 - Today Show Radio', channelNum:'108', title:'Today Show Radio', id:'9390', parentID:'00070044g%3aentertainment'},
{fullTitle:'109 - SiriusXM Stars', channelNum:'109', title:'SiriusXM Stars', id:'siriusstars', parentID:'00070044g%3aentertainment'},
{fullTitle:'11 - KIIS-Los Angeles', channelNum:'11', title:'KIIS-Los Angeles', id:'8241', parentID:'00070044g%3amore'},
{fullTitle:'110 - Doctor Radio', channelNum:'110', title:'Doctor Radio', id:'doctorradio', parentID:'00070044g%3aentertainment'},
{fullTitle:'111 - Business Radio', channelNum:'111', title:'Business Radio', id:'9359', parentID:'00070044g%3aentertainment'},
{fullTitle:'12 - Z100/NY', channelNum:'12', title:'Z100/NY', id:'8242', parentID:'00070044g%3amore'},
{fullTitle:'128 - Joel Osteen Radio', channelNum:'128', title:'Joel Osteen Radio', id:'9392', parentID:'00070044g%3aentertainment'},
{fullTitle:'129 - The Catholic Channel', channelNum:'129', title:'The Catholic Channel', id:'thecatholicchannel', parentID:'00070044g%3areligion'},
{fullTitle:'130 - EWTN Radio', channelNum:'130', title:'EWTN Radio', id:'ewtnglobal', parentID:'00070044g%3areligion'},
{fullTitle:'131 - Family Talk', channelNum:'131', title:'Family Talk', id:'8307', parentID:'00070044g%3areligion'},
{fullTitle:'141 - HUR Voices', channelNum:'141', title:'HUR Voices', id:'9129', parentID:'00070044g%3amore'},
{fullTitle:'142 - HBCU', channelNum:'142', title:'HBCU', id:'9130', parentID:'00070044g%3amore'},
{fullTitle:'143 - BYUradio', channelNum:'143', title:'BYUradio', id:'9131', parentID:'00070044g%3amore'},
{fullTitle:'146 - Road Dog Trucking', channelNum:'146', title:'Road Dog Trucking', id:'roaddogtrucking', parentID:'00070044g%3aentertainment'},
{fullTitle:'148 - RadioClassics', channelNum:'148', title:'RadioClassics', id:'radioclassics', parentID:'00070044g%3aentertainment'},
{fullTitle:'168 - Canada Laughs', channelNum:'168', title:'Canada Laughs', id:'8259', parentID:'00070044g%3acomedy'},
{fullTitle:'206 - Opie Radio', channelNum:'206', title:'Opie Radio', id:'8184', parentID:'00070044g%3aentertainment'},
{fullTitle:'400 - Carlins Corner', channelNum:'400', title:'Carlins Corner', id:'9181', parentID:'00070044g%3acomedy'},
{fullTitle:'790 - SXM Limited Edition 11', channelNum:'790', title:'SXM Limited Edition 11', id:'9405', parentID:'00070044g%3aentertainment'},
{fullTitle:'791 - Vivid Radio', channelNum:'791', title:'Vivid Radio', id:'8369', parentID:'00070044g%3aentertainment'},
{fullTitle:'794 - SiriusXM Preview', channelNum:'794', title:'SiriusXM Preview', id:'0000', parentID:'00070044g%3aentertainment'},
{fullTitle:'94 - SiriusXM Comedy Greats', channelNum:'94', title:'SiriusXM Comedy Greats', id:'9408', parentID:'00070044g%3acomedy'},
{fullTitle:'95 - Comedy Central Radio', channelNum:'95', title:'Comedy Central Radio', id:'9356', parentID:'00070044g%3acomedy'},
{fullTitle:'96 - The Foxxhole', channelNum:'96', title:'The Foxxhole', id:'thefoxxhole', parentID:'00070044g%3acomedy'},
{fullTitle:'97 - Comedy Roundup', channelNum:'97', title:'Comedy Roundup', id:'bluecollarcomedy', parentID:'00070044g%3acomedy'},
{fullTitle:'98 - Laugh USA', channelNum:'98', title:'Laugh USA', id:'laughbreak', parentID:'00070044g%3acomedy'},
{fullTitle:'99 - Raw Dog Comedy Hits', channelNum:'99', title:'Raw Dog Comedy Hits', id:'rawdog', parentID:'00070044g%3acomedy'},
{fullTitle:'144 - Korea Today', channelNum:'144', title:'Korea Today', id:'9132', parentID:'00070044g%3amore'},
{fullTitle:'152 - En Vivo', channelNum:'152', title:'En Vivo', id:'9135', parentID:'00070044g%3amore'},
{fullTitle:'153 - Cristina Radio', channelNum:'153', title:'Cristina Radio', id:'9134', parentID:'00070044g%3amore'},
{fullTitle:'154 - American Latino Radio', channelNum:'154', title:'American Latino Radio', id:'9133', parentID:'00070044g%3amore'},
{fullTitle:'162 - CBC Radio 3', channelNum:'162', title:'CBC Radio 3', id:'cbcradio3', parentID:'00070044g%3acanadian'},
{fullTitle:'163 - Ici Musique Chansons', channelNum:'163', title:'Ici Musique Chansons', id:'8245', parentID:'00070044g%3acanadian'},
{fullTitle:'165 - Multicultural Radio', channelNum:'165', title:'Multicultural Radio', id:'9358', parentID:'00070044g%3acanadian'},
{fullTitle:'166 - Ici FrancoCountry', channelNum:'166', title:'Ici FrancoCountry', id:'rockvelours', parentID:'00070044g%3acanadian'},
{fullTitle:'167 - Canada Talks', channelNum:'167', title:'Canada Talks', id:'9172', parentID:'00070044g%3acanadian'},
{fullTitle:'170 - Ici Première', channelNum:'170', title:'Ici Première', id:'premiereplus', parentID:'00070044g%3acanadian'},
{fullTitle:'171 - CBC Country', channelNum:'171', title:'CBC Country', id:'bandeapart', parentID:'00070044g%3acanadian'},
{fullTitle:'172 - Canada 360 by AMI', channelNum:'172', title:'Canada 360 by AMI', id:'8248', parentID:'00070044g%3acanadian'},
{fullTitle:'173 - The Verge', channelNum:'173', title:'The Verge', id:'8244', parentID:'00070044g%3acanadian'},
{fullTitle:'174 - Influence Franco', channelNum:'174', title:'Influence Franco', id:'8246', parentID:'00070044g%3acanadian'},
{fullTitle:'470 - El Paisa', channelNum:'470', title:'El Paisa', id:'9414', parentID:'00070044g%3amore'},
{fullTitle:'758 - Iceberg', channelNum:'758', title:'Iceberg', id:'icebergradio', parentID:'00070044g%3acanadian'},
{fullTitle:'759 - Attitude Franco', channelNum:'759', title:'Attitude Franco', id:'energie2', parentID:'00070044g%3acanadian'},
];


module.exports = function (api) {
  api.registerAction('siriusxm', siriusXM);
}

