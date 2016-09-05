[![PayPal donate button](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=jimmy%2eshimizu%40gmail%2ecom&lc=SE&item_name=Support%20open%20source%20initiative&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted "Donate once-off to this project using Paypal")

Feel free to use it as you please. Consider donating if you want to support further development.

SONOS HTTP API
==============

** Beta is no more, master is up to date with the beta now! **

**This application requires node 4.0.0 or higher!**

**This does NOT work on Node 6+ at the moment**

A simple http based API for controlling your Sonos system.

There is a simple sandbox at /docs (incomplete atm)

USAGE
-----

Start by fixing your dependencies. Invoke the following command:

`npm install --production`

This will download the necessary dependencies if possible.

start the server by running

`npm start`

Now you can control your system by invoking the following commands:

	http://localhost:5005/zones
	http://localhost:5005/lockvolumes
	http://localhost:5005/unlockvolumes
	http://localhost:5005/pauseall[/{timeout in minutes}]
	http://localhost:5005/resumeall[/{timeout in minutes}]
	http://localhost:5005/preset/{JSON preset}
	http://localhost:5005/preset/{predefined preset name}
	http://localhost:5005/reindex
	http://localhost:5005/{room name}/sleep/{timeout in seconds or "off"}
	http://localhost:5005/{room name}/sleep/{timeout in seconds or "off"}
	http://localhost:5005/{room name}/{action}[/{parameter}]

Example:

`http://localhost:5005/living room/volume/15`
(will set volume for room Living Room to 15%)

`http://localhost:5005/living room/volume/+1`
(will increase volume by 1%)

`http://localhost:5005/living room/next`
(will skip to the next track on living room, unless it's not a coordinator)

`http://localhost:5005/living room/pause`
(will pause the living room)

`http://localhost:5005/living room/favorite/mysuperplaylist`
(will replace queue with the favorite called "mysuperplaylist")

`http://localhost:5005/living room/repeat/on`
(will turn on repeat mode for group)


The actions supported as of today:

* play
* pause
* playpause (toggles playing state)
* volume (parameter is absolute or relative volume. Prefix +/- indicates relative volume)
* groupVolume (parameter is absolute or relative volume. Prefix +/- indicates relative volume)
* mute / unmute
* groupMute / groupUnmute
* trackseek (parameter is queue index)
* timeseek (parameter is in seconds, 60 for 1:00, 120 for 2:00 etc)
* next
* previous
* state (will return a json-representation of the current state of player)
* favorite
* favorites (with optional "detailed" parameter)
* playlist
* lockvolumes / unlockvolumes (experimental, will enforce the volume that was selected when locking!)
* repeat (on/off)
* shuffle (on/off)
* crossfade (on/off)
* pauseall (with optional timeout in minutes)
* resumeall (will resume the ones that was pause on the pauseall call. Useful for doorbell, phone calls, etc. Optional timeout)
* say
* sayall
* queue
* clearqueue
* sleep (values in seconds)


State
-----

Example of a state json:

	{
	  "currentTrack":{
	    "artist":"College",
	    "title":"Teenage Color - Anoraak Remix",
	    "album":"Nightdrive With You",
	    "albumArtURI":"/getaa?s=1&u=x-sonos-spotify%3aspotify%253atrack%253a3DjBDQs8ebkxMBo2V8V3SH%3fsid%3d9%26flags%3d32",
	    "duration":347,
	    "uri":"x-sonos-spotify:spotify%3atrack%3a3DjBDQs8ebkxMBo2V8V3SH?sid=9&flags=32"
	  },
	  "nextTrack":{
	    "artist":"Blacknuss",
	    "title":"Thinking of You",
	    "album":"3",
	    "albumArtURI":"/getaa?s=1&u=x-sonos-spotify%3aspotify%253atrack%253a4U93TIa0X6jGQrTBGTkChH%3fsid%3d9%26flags%3d32",
	    "duration":235,
	    "uri":"x-sonos-spotify:spotify%3atrack%3a4U93TIa0X6jGQrTBGTkChH?sid=9&flags=32"
	  },
	  "volume":18,
	  "mute":false,
	  "trackNo":161,
	  "elapsedTime":200,
	  "elapsedTimeFormatted":"03:20",
	  "zoneState":"PAUSED_PLAYBACK",
	  "playerState":"PLAYING",
	  "zonePlayMode":{
	    "shuffle":true,
	    "repeat":false,
	    "crossfade":false
	  }
	}

Queue
-----
Obtain the current queue list from a specified player. The request will accept:
 - No parameters

	`http://localhost:5005/living room/queue`
 - Just a start index for the queue

	`http://localhost:5005/living room/queue/[start-index]`
 - A start index and a count of items to return

	`http://localhost:5005/living room/queue/[start-index]/[count]`



Example queue response:
```
{
  "startIndex": "0",
  "numberReturned": 2,
  "totalMatches": 33,
  "items": [
    {
      "uri": "x-sonos-spotify:spotify%3atrack%3a0AvV49z4EPz5ocYN7eKGAK?sid=9&flags=8224&sn=3",
      "albumArtURI": "/getaa?s=1&u=x-sonos-spotify%3aspotify%253atrack%253a0AvV49z4EPz5ocYN7eKGAK%3fsid%3d9%26flags%3d8224%26sn%3d3",
      "title": "No Diggity",
      "artist": "Blackstreet",
      "album": "Another Level"
    },
    {
      "uri": "x-sonos-spotify:spotify%3atrack%3a5OQGeJ1ceykovrykZsGhqL?sid=9&flags=8224&sn=3",
      "albumArtURI": "/getaa?s=1&u=x-sonos-spotify%3aspotify%253atrack%253a5OQGeJ1ceykovrykZsGhqL%3fsid%3d9%26flags%3d8224%26sn%3d3",
      "title": "Breathless",
      "artist": "The Corrs",
      "album": "In Blue"
    }
  ]
}
```


Preset
------

A preset is a predefined grouping of players with predefined volumes, that will start playing whatever is in the coordinators queue.

Example preset (state and uri are optional):

	{
	  "players": [
	    { "roomName": "room1", "volume": 15},
	    {"roomName": "room2", "volume": 25}
	  ],
	  "state": "stopped",
	  "favorite": "my favorite name",
	  "uri": "x-rincon-stream:RINCON_0000000000001400",
	  "playMode": {
	    "shuffle": true
	  },
	  "pauseOthers": true
	  "sleep": 600
	}

The first player listed in the example, "room1", will become the coordinator. It will loose it's queue when ungrouped but eventually that will be fixed in the future. Playmode defines the three options "shuffle", "repeat", "crossfade" similar to the state
Favorite will have precedence over a uri.
pauseOthers will pause all zones before applying the preset, effectively muting your system.  sleep is an optional value that enables the sleep timer and is defined in total seconds (600 = 10 minutes).

presets.json
-----------

You can create a file with pre made presets, called presets.json. It will be loaded upon start, any changes requires a restart of the server.

Example content:

```json
{
  "all": {
    "playMode": {
      "shuffle": true
    },
    "players": [
      {
        "roomName": "Bathroom",
        "volume": 10
      },
      {
        "roomName": "Kitchen",
        "volume": 10
      },
      {
        "roomName": "Office",
        "volume": 10
      },
      {
        "roomName": "Bedroom",
        "volume": 10
      },
      {
        "roomName": "TV Room",
        "volume": 15
      }
    ],
    "pauseOthers": true
  },
  "tv": {
    "players": [
      {
        "roomName": "TV Room",
        "volume": 20
      }
    ],
    "pauseOthers": true,
    "uri": "x-rincon-stream:RINCON_000XXXXXXXXXX01400"
  }
}
```


In the example, there is one preset called `all`, which you can apply by invoking:

`http://localhost:5005/preset/all`

settings.json
-------------

If you want to change default settings, you can create a settings.json file and put in the root folder.

Available options are:

* port: change the listening port
* cacheDir: dir for tts files
* https: use https which requires a key and certificate or pfx file
* auth: require basic auth credentials which requires a username and password
* announceVolume: the percentual volume use when invoking say/sayall without any volume parameter

Example:
```json
	{
	  "voicerss": "Your api key for TTS with voicerss",
	  "port": 5005,
	  "securePort": 5006,
	  "cacheDir": "./cache",
	  "https": {
	    "key": "/path/to/key.pem",
	    "cert" : "/path/to/cert.pem"

	    //... for pfx (alternative configuration)
	    "pfx": "/path/to/pfx.pfx",
	    "passphrase": "your-passphrase-if-applicable"
	  },
	  "auth": {
	    "username": "admin",
	    "password": "password"
	  },
	  "announceVolume": 40
	}
```

Override as it suits you.



Favorites
---------

It now has support for starting favorites. Simply invoke:

`http://localhost:5005/living room/favorite/[favorite name]`

and it will replace the queue with that favorite. Bear in mind that favorites may share name, which might give unpredictable behavior at the moment.

Playlist
---------

Playing a Sonos playlist is now supported. Invoke the following:

`http://localhost:5005/living room/playlist/[playlist name]`

and it will replace the queue with the playlist and starts playing.


Say (TTS support)
-----------------

Experimental support for TTS. This REQUIRES a registered API key from voiceRSS! See http://www.voicerss.org/ for info.

You need to add this to a file called settings.json (create if it doesn't exist), like this:

```
{
  "voicerss": "f5e77e1d42063175b9219866129189a3"
}
```

Replace the code above (it is just made up) with the api-key you've got after registering.

Action is:

	/[Room name]/say/[phrase][/[language_code]][/[announce volume]]
	/sayall/[phrase][/[language_code]][/[announce volume]]

Example:

	/Office/say/Hello, dinner is ready
	/Office/say/Hej, maten är klar/sv-se
	/sayall/Hello, dinner is ready
	/Office/say/Hello, dinner is ready/90
	/Office/say/Hej, maten är klar/sv-se/90

language code needs to be before volume if specified.

Sayall will group all players, set 40% volume (by default) and then try and restore everything as the way it where. Please try it out, it will probably contain glitches but please report detailed descriptions on what the problem is (starting state, error that occurs, and the final state of your system).

The supported language codes are:

|ca-es|Catalan|
|zh-cn|Chinese (China)|
|zh-hk|Chinese (Hong Kong)|
|zh-tw|Chinese (Taiwan)|
|da-dk|Danish|
|nl-nl|Dutch|
|en-au|English (Australia)|
|en-ca|English (Canada)|
|en-gb|English (Great Britain)|
|en-in|English (India)|
|en-us|English (United States)|
|fi-fi|Finnish|
|fr-ca|French (Canada)|
|fr-fr|French (France)|
|de-de|German|
|it-it|Italian|
|ja-jp|Japanese|
|ko-kr|Korean|
|nb-no|Norwegian|
|pl-pl|Polish|
|pt-br|Portuguese (Brazil)|
|pt-pt|Portuguese (Portugal)|
|ru-ru|Russian|
|es-mx|Spanish (Mexico)|
|es-es|Spanish (Spain)|
|sv-se|Swedish (Sweden)|

Spotify, Apple Music, and SiriusXM (Experimental)
----------------------

The following endpoints are available:

```
# Spotify
/RoomName/spotify/now/spotify:track:4LI1ykYGFCcXPWkrpcU7hn
/RoomName/spotify/next/spotify:track:4LI1ykYGFCcXPWkrpcU7hn
/RoomName/spotify/queue/spotify:track:4LI1ykYGFCcXPWkrpcU7hn

# Apple Music
/RoomName/applemusic/{now,next,queue}/song:{songID}
/RoomName/applemusic/{now,next,queue}/album:{albumID}

# SiriusXM
/RoomName/siriusXM/{channel number,station name}
```

You can find Apple Music song and album IDs via the [iTunes Search
API](https://affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api/).

It only handles a single spotify account currently. It will probably use the first account added on your system. 

You can specify a SiriusXM channel number or station name and the station will be played.


Music Search and Play
----------------------
Perform a search for a song, artist, album or station and begin playing. Supports Apple Music, Spotify, Deezer, Deezer Elite, and your local Music Library. 

The following endpoint is available:

```
/RoomName/musicsearch/{service}/{type}/{search term}

Service options: apple, spotify, deezer, elite, library

Type options for apple, spotify, deezer, and elite: album, song, station 
Station plays a Pandora like artist radio station for a specified artist name. 
Apple Music also supports song titles and artist name + song title.

Type options for library: album, song, load 
Load performs an initial load or relaod of the local Sonos music library. 
The music library will also get loaded the first time that the library service is 
used if the load command has not been issued before.

Search terms for song for all services: artist name, song title, artist name + song title
Search terms for album for all services: artist name, album title, artist name + album title

Search terms for station for apple: artist name, song title, artist name + song title
Search terms for station for spotify and deezer: artist name
Search terms for station for library: not supported

Specifying just an artist name will load the queue with up to 50 of the artist's most popular songs
Specifying a song title or artist + song title will insert the closest match to the song into 
the queue and start playing it

Examples:
/Den/musicsearch/spotify/song/red+hot+chili+peppers
/Kitchen/musicsearch/apple/song/dark+necessities
/Playroom/musicsearch/library/song/red+hot+chili+peppers+dark+necessities

/Den/musicsearch/spotify/album/abbey+road
/Playroom/musicsearch/library/album/red+hot+chili+peppers+the+getaway
/Kitchen/musicsearch/spotify/album/dark+necessities

/Den/musicsearch/spotify/station/red+hot+chili+peppers
/Kitchen/musicsearch/apple/station/dark+necessities  (Only Apple Music supports song titles)
/Playroom/musicsearch/apple/station/red+hot+chili+peppers+dark+necessities  (Only Apple Music supports song titles)

/Kitchen/musicsearch/library/load  (Loads or reloads the music library from Sonos)
```


Experiment with these and leave feedback!

Docker
-------

** Docker is now an unsupported feature, no support is given **

A docker file is included, make sure that if you use this that you start up your container with "--net=host" example:

```
docker run --net=host --restart=always -d <your container/image name>
```

The restart always is to keep it running after a reboot and to keep it alive it if crashes.
More information for docker https://docs.docker.com

Webhook
-------

NOTE! This is experimental and might change in the future! Please leave your feedback as github issues if you feel like it doesn't suit your need, since I don't know what kind of restrictions you will be facing.

Since 0.17.x there is now support for a web hook. If you add a setting in settings.json like this:

```
{
  "webhook": "http://localhost:5007/"
}
```

Every state change and topology change will be posted (method POST) to that URL, as JSON. The following data structure will be sent:

```
{
  "type": "transport-state",
  "data": { (snapshot of player) }
}
```

or

```
{
  "type": "topology-change",
  "data": { (snapshot of zones) }
}
```

"data" property will be equal to the same data as you would get from /RoomName/state or /zones. There is an example endpoint in the root if this project called test_endpoint.js which you may fire up to get an understanding of what is posted, just invoke it with "node test_endpoint.js" in a terminal, and then start the http-api in another terminal.


