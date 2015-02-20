[![PayPal donate button](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=jimmy%2eshimizu%40gmail%2ecom&lc=SE&item_name=Support%20open%20source%20initiative&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted "Donate once-off to this project using Paypal")

Feel free to use it as you please. Consider donating if you want to support further development.

SONOS HTTP API
==============

A simple http based API for controlling your Sonos system. I try to follow compatibility versioning between this and sonos-discovery, which means that 0.3.x requires 0.3.x of sonos-discovery.

There is a simple sandbox at /docs (incomplete atm)

USAGE
-----

Start by fixing your dependencies. Invoke the following command:

`npm install`

This will download the necessary dependencies if possible (you will need git for this)

start the server by running

`node server.js`

Now you can control your system by invoking the following commands:

	http://localhost:5005/zones
	http://localhost:5005/lockvolumes
	http://localhost:5005/unlockvolumes
	http://localhost:5005/pauseall[/{timeout in minutes}]
	http://localhost:5005/resumeall[/{timeout in minutes}]
	http://localhost:5005/preset/{JSON preset}
	http://localhost:5005/preset/{predefined preset name}
	http://localhost:5005/{room name}/{action}[/{parameter}]
	http://localhost:5005/reindex
	http://localhost:5005/sleep/{timeout in seconds or timestamp HH:MM:SS or off}

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
* seek (parameter is queue index)
* trackseek (parameter is in seconds, 60 for 1:00, 120 for 2:00 etc)
* next
* previous
* state (will return a json-representation of the current state of player)
* favorite
* playlist
* lockvolumes / unlockvolumes (experimental, will enforce the volume that was selected when locking!)
* repeat (on/off)
* shuffle (on/off)
* crossfade (on/off)
* pauseall (with optional timeout in minutes)
* resumeall (will resume the ones that was pause on the pauseall call. Useful for doorbell, phone calls, etc. Optional timeout)
* say
* clearqueue


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
	  "playMode": "SHUFFLE",
	  "pauseOthers": true
	}

The first player listed in the example, "room1", will become the coordinator. It will loose it's queue when ungrouped but eventually that will be fixed in the future. Playmodes are the ones defined in UPnP, which are: NORMAL, REPEAT_ALL, SHUFFLE_NOREPEAT, SHUFFLE
Favorite will have precedence over a uri. Playmode requires 0.4.2 of sonos-discovery to work.
pauseOthers will pause all zones before applying the preset, effectively muting your system.

preset.json
-----------

You can create a file with pre made presets, called presets.json. I've included a sample file based on my own setup. In the example, there is one preset called `all`, which you can apply by invoking:

`http://localhost:5005/preset/all`

settings.json
-------------

If you want to change port or the cache dir for tts files, you can create a settings.json file and put in the root folder.

The defaults are:

	{
	  port: 5005,
	  cacheDir: './cache'
	}

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

Experimental support for TTS. Action is:

	/[Room name]/say/[phrase][/[language_code]]
	/sayall/[phrase][/[language_code]]

Example:

	/Office/say/Hello, dinner is ready
	/Office/say/Hej, maten är klar/sv
	/sayall/Hello, dinner is ready

Sayall will group all players, set 20% volume and then try and restore everything as the way it where. Please try it out, it will probably contain glitches but please report detailed descriptions on what the problem is (starting state, error that occurs, and the final state of your system).

