[![PayPal donate button](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://www.paypal.me/jishi "Donate once-off to this project using Paypal") [![Join the chat at gitter](https://img.shields.io/gitter/room/badges/shields.svg)](https://gitter.im/node-sonos-http-api/Lobby "Need assistance? Join the chat at Gitter.im") 

⚠WARNING!⚠

The Sonos S2 update, released June 2020, still works with this API. However, it might break in the future if and when Sonos decide to drop UPnP as the control protocol. 


Feel free to use it as you please. Consider donating if you want to support further development. Reach out on the gitter chat if you have issues getting it to run, instead of creating new issues, thank you!

If you are also looking for cloud control (ifttt, public webhooks etc), see the [bronos-client](http://www.bronos.net) project! That pi image also contains an installation of this http-api.  

SONOS HTTP API
==============

** Beta is no more, master is up to date with the beta now! **

**This application requires node 4.0.0 or higher!**

**This should now work on Node 6+, please let me know if you have issues**

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
* togglemute (toggles mute state)
* trackseek (parameter is queue index)
* timeseek (parameter is in seconds, 60 for 1:00, 120 for 2:00 etc)
* next
* previous
* state (will return a json-representation of the current state of player)
* favorite
* favorites (with optional "detailed" parameter)
* playlist
* lockvolumes / unlockvolumes (experimental, will enforce the volume that was selected when locking!)
* repeat (on(=all)/one/off(=none)/toggle)
* shuffle (on/off/toggle)
* crossfade (on/off/toggle)
* pauseall (with optional timeout in minutes)
* resumeall (will resume the ones that was pause on the pauseall call. Useful for doorbell, phone calls, etc. Optional timeout)
* say
* sayall
* saypreset
* queue
* clearqueue
* sleep (values in seconds)
* linein (only analog linein, not PLAYBAR yet)
* clip (announce custom mp3 clip)
* clipall
* clippreset
* join / leave  (Grouping actions)
* sub (on/off/gain/crossover/polarity) See SUB section for more info
* nightmode (on/off/toggle, PLAYBAR only)
* speechenhancement (on/off/toggle, PLAYBAR only)
* bass/treble (use -10 through to 10 as the value. 0 is neutral)


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
	  },
	  "equalizer": {
        "bass": 0,
        "treble": 0,
        "loudness": true
      }
	}

Queue
-----
Obtain the current queue list from a specified player. The request will accept:
 - limit (optional)
 - offset (optional, requires limit)
 - detailed flag (optional, include uri in response)

	    http://localhost:5005/living room/queue
	    http://localhost:5005/living room/queue/10 (only return top 10)
	    http://localhost:5005/living room/queue/10/10 (return result 11-20)
	    http://localhost:5005/living room/queue/detailed
	    http://localhost:5005/living room/queue/10/detailed

Example queue response:
```
[
    {
      "albumArtURI": "/getaa?s=1&u=x-sonos-spotify%3aspotify%253atrack%253a0AvV49z4EPz5ocYN7eKGAK%3fsid%3d9%26flags%3d8224%26sn%3d3",
      "title": "No Diggity",
      "artist": "Blackstreet",
      "album": "Another Level"
    },
    {
      "albumArtURI": "/getaa?s=1&u=x-sonos-spotify%3aspotify%253atrack%253a5OQGeJ1ceykovrykZsGhqL%3fsid%3d9%26flags%3d8224%26sn%3d3",
      "title": "Breathless",
      "artist": "The Corrs",
      "album": "In Blue"
    }
]

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

presets.json (deprecated, use preset files instead)
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


presets folder
--------------

You can create a preset files in the presets folder with pre made presets. It will be loaded upon start, any changes made to files in this folder (addition, removal, modification) will trigger a reload of your presets. The name of the file (xxxxxx.json) will become the name of the preset. It will be parsed as JSON5, to be more forgiving of typos. See http://json5.org/ for more info.

Example content:

```json
{
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
  "trackNo": 3,
  "elapsedTime": 42,
  "playMode": {
    "shuffle": true,
    "repeat": "all",
    "crossfade": false
  },
  "pauseOthers": false,
  "favorite": "My example favorite"
}
```

There is an example.json bundled with this repo. The name of the file will become the name of the preset.

settings.json
-------------

If you want to change default settings, you can create a settings.json file and put in the root folder. This will be parsed as JSON5, to be more forgiving. See http://json5.org/ for more info.

Available options are:

* port: change the listening port
* ip: change the listening IP
* https: use https which requires a key and certificate or pfx file
* auth: require basic auth credentials which requires a username and password
* announceVolume: the percentual volume use when invoking say/sayall without any volume parameter
* presetDir: absolute path to look for presets (folder must exist!)
* household: when theres multiple sonos accounts on one network (example: Sonos_ab7d67898dcc5a6d, find it in [Your sonos IP]:1400/status/zp). Note that the value after the '.' should not be removed. See more info here: https://github.com/jishi/node-sonos-http-api/issues/783


Example:
```json
	{
	  "voicerss": "Your api key for TTS with voicerss",
	  "microsoft": {
	    "key": "Your api for Bing speech API",
	    "name": "ZiraRUS"
	  },
	  "port": 5005,
	  "ip": "0.0.0.0",
	  "securePort": 5006,
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
	  "announceVolume": 40,
	  "pandora": {
	    "username": "your-pandora-account-email-address",
	    "password": "your-pandora-password"
	  },
	  "spotify": {
	    "clientId": "your-spotify-application-clientId",
	    "clientSecret": "your-spotify-application-clientSecret"
	  },
	  "library": {
	    "randomQueueLimit": 50
	  }
	}
```

Override as it suits you.

Note for Spotify users!
-----------------------

To use Spotify, go to https://developer.spotify.com/my-applications/#!/applications/create and create a Spotify application to get your client keys. You can name it Sonos or anything else and you don't have to change any values. Use the Client ID and the Client Secret values in the settings.json file as indicated above.


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

Experimental support for TTS. Today the following providers are available:

* voicerss
* Microsoft Cognitive Services (Bing Text to Speech API)
* AWS Polly
* Google (default)
* macOS say command
* Elevenlabs

It will use the one you configure in settings.json. If you define settings for multiple TTS services, it will not be guaranteed which one it will choose!

#### VoiceRSS

This REQUIRES a registered API key from voiceRSS! See http://www.voicerss.org/ for info.

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

| Language code | Language |
| ------------- | -------- |
| ca-es | Catalan  |
| zh-cn | Chinese (China) |
| zh-hk |Chinese (Hong Kong) |
| zh-tw | Chinese (Taiwan) |
| da-dk | Danish |
| nl-nl | Dutch |
| en-au | English (Australia) |
| en-ca | English (Canada) |
| en-gb | English (Great Britain) |
| en-in | English (India) |
| en-us | English (United States) |
| fi-fi | Finnish |
| fr-ca | French (Canada) |
| fr-fr | French (France) |
| de-de | German |
| it-it | Italian |
| ja-jp | Japanese |
| ko-kr | Korean |
| nb-no | Norwegian |
| pl-pl | Polish |
| pt-br | Portuguese (Brazil) |
| pt-pt | Portuguese (Portugal) |
| ru-ru | Russian |
| es-mx | Spanish (Mexico) |
| es-es | Spanish (Spain) |
| sv-se | Swedish (Sweden) |

#### Microsoft
This one also requires a registered api key. You can sign up for free here: https://www.microsoft.com/cognitive-services/en-US/subscriptions?mode=NewTrials and select "Bing Speech - Preview".

The following configuration is available (the entered values except key are default, and may be omitted):

```json
	{
	  "microsoft": {
	    "key": "Your api for Bing speech API",
	    "name": "ZiraRUS"
	  }
	}
```

You change language by specifying a voice name correlating to the desired language.
Name should be specified according to this list: https://www.microsoft.com/cognitive-services/en-us/speech-api/documentation/API-Reference-REST/BingVoiceOutput#SupLocales
where name is the right most part of the voice font name (without optional Apollo suffix). Example:

`Microsoft Server Speech Text to Speech Voice (ar-EG, Hoda)` name should be specified as `Hoda`

`Microsoft Server Speech Text to Speech Voice (de-DE, Stefan, Apollo)` name should be specified as `Stefan`

`Microsoft Server Speech Text to Speech Voice (en-US, BenjaminRUS)` name should be specified as `BenjaminRUS`

Action is:

	/[Room name]/say/[phrase][/[name]][/[announce volume]]
	/sayall/[phrase][/[name]][/[announce volume]]

Example:

	/Office/say/Hello, dinner is ready
	/Office/say/Hello, dinner is ready/BenjaminRUS
	/Office/say/Guten morgen/Stefan
	/sayall/Hello, dinner is ready
	/Office/say/Hello, dinner is ready/90
	/Office/say/Guten morgen/Stefan/90

Supported voices are:

 Hoda, Naayf, Ivan, HerenaRUS, Jakub, Vit, HelleRUS, Michael, Karsten, Hedda, Stefan, Catherine, Linda, Susan, George, Ravi, ZiraRUS, BenjaminRUS, Laura, Pablo, Raul, Caroline, Julie, Paul, Cosimo, Ayumi, Ichiro, Daniel, Irina, Pavel, HuihuiRUS, Yaoyao, Kangkang, Tracy, Danny, Yating, Zhiwei

See https://www.microsoft.com/cognitive-services/en-us/speech-api/documentation/API-Reference-REST/BingVoiceOutput#SupLocales to identify
which language and gender it maps against. If your desired voice is not in the list of supported one, raise an issue about adding it or send me a PR.

#### AWS Polly

Requires AWS access tokens, which you generate for your user. Since this uses the AWS SDK, it will look for settings in either Environment variables, the ~/.aws/credentials or ~/.aws/config.

You can also specify it for this application only, using:
```json
	{
	  "aws": {
	    "credentials": {
	      "region": "eu-west-1",
	      "accessKeyId": "Your access key id",
	      "secretAccessKey": "Your secret"
	    },
	    "name": "Joanna"
	  }
	}
```

To select the neural engine, append `Neural` to the name, e.g. `DanielNeural`.

Choose the region where you registered your account, or the one closest to you.

If you have your credentials elsewhere and want to stick with the default voice, you still need to make sure that the aws config option is set to trigger AWS TTS:

```json
	{
	  "aws": {}
	}
```

Action is:

	/[Room name]/say/[phrase][/[name]][/[announce volume]]
	/sayall/[phrase][/[name]][/[announce volume]]

Example:

	/Office/say/Hello, dinner is ready
	/Office/say/Hello, dinner is ready/Nicole
	/Office/say/Hej, maten är klar/Astrid
	/sayall/Hello, dinner is ready
	/Office/say/Hello, dinner is ready/90
	/Office/say/Hej, maten är klar/Astrid/90

This is the current list of voice names and their corresponding language and accent (as of Dec 2016).
To get a current list of voices, you would need to use the AWS CLI and invoke the describe-voices command.

| Language | Code | Gender | Name |
| --------- | ---- | ------ | ---- |
| Australian English | en-AU | Female | Nicole |
| Australian English | en-AU | Male | Russell |
| Brazilian Portuguese | pt-BR | Female | Vitoria |
| Brazilian Portuguese | pt-BR | Male | Ricardo |
| British English | en-GB | Male | Brian |
| British English | en-GB | Female | Emma |
| British English | en-GB | Female | Amy |
| Canadian French | fr-CA | Female | Chantal |
| Castilian Spanish | es-ES | Female | Conchita |
| Castilian Spanish | es-ES | Male | Enrique |
| Danish | da-DK | Female | Naja |
| Danish | da-DK | Male | Mads |
| Dutch | nl-NL | Male | Ruben |
| Dutch | nl-NL | Female | Lotte |
| French | fr-FR | Male | Mathieu |
| French | fr-FR | Female | Celine |
| German | de-DE | Female | Marlene |
| German | de-DE | Male | Hans |
| Icelandic | is-IS | Male | Karl |
| Icelandic | is-IS | Female | Dora |
| Indian English | en-IN | Female | Raveena |
| Italian | it-IT | Female | Carla |
| Italian | it-IT | Male | Giorgio |
| Japanese | ja-JP | Female | Mizuki |
| Norwegian | nb-NO | Female | Liv |
| Polish | pl-PL | Female | Maja |
| Polish | pl-PL | Male | Jacek |
| Polish | pl-PL | Male | Jan |
| Polish | pl-PL | Female | Ewa |
| Portuguese | pt-PT | Female | Ines |
| Portuguese | pt-PT | Male | Cristiano |
| Romanian | ro-RO | Female | Carmen |
| Russian | ru-RU | Female | Tatyana |
| Russian | ru-RU | Male | Maxim |
| Swedish | sv-SE | Female | Astrid |
| Turkish | tr-TR | Female | Filiz |
| US English | en-US | Male | Justin |
| US English | en-US | Female | Joanna |
| US English | en-US | Male | Joey |
| US English | en-US | Female | Ivy |
| US English | en-US | Female | Salli |
| US English | en-US | Female | Kendra |
| US English | en-US | Female | Kimberly |
| US Spanish | es-US | Female | Penelope |
| US Spanish | es-US | Male | Miguel |
| Welsh | cy-GB | Female | Gwyneth |
| Welsh English | en-GB-WLS | Male | Geraint |

#### Elevenlabs

Elevenlabs is a TTS service enabling generatiung TTS audio files using AI generated voices.

Requires API Key and optionally default voiceId.

Since Elevenlabs AI models are multilingual by default, there is no need (nor place) for `language` parameter in 
Elevenlabs API. Because of this, `language` parameter in URL is used to inject custom `voiceId` on per-request basis. You will
need to either configure default voiceId in `settings.json` or provide `voiceId` with every HTTP request.

##### Config

Minimal:
```json
	{
	  "elevenlabs": {
		"auth": {
		  "apiKey": ""
		}
	  }
	}
```

Full:
```json
	{
	  "elevenlabs": {
		"auth": {
		  "apiKey": ""
		},
		"config": {
		  "voiceId": "",
		  "stability": 0.5,
		  "similarityBoost": 0.5,
		  "speakerBoost": true,
		  "style": 1,
		  "modelId": "eleven_multilingual_v2"
		}
	  }
	}
```

#### Google (default if no other has been configured)

Does not require any API keys. Please note that Google has been known in the past to change the requirements for its Text-to-Speech API, and this may stop working in the future. There is also limiations to how many requests one is allowed to do in a specific time period.

The following language codes are supported

| Language code | Language |
| ------------- | -------- |
| af | Afrikaans |
| sq | Albanian |
| ar | Arabic |
| hy | Armenian |
| bn | Bengali |
| ca | Catalan |
| zh | Chinese |
| zh-cn | Chinese (Mandarin/China) |
| zh-tw | Chinese (Mandarin/Taiwan) |
| zh-yue | Chinese (Cantonese) |
| hr | Croatian |
| cs | Czech |
| da | Danish |
| nl | Dutch |
| en | English |
| en-au | English (Australia) |
| en-gb | English (Great Britain) |
| en-us | English (United States) |
| eo | Esperanto |
| fi | Finnish |
| fr | Franch |
| de | German |
| el | Greek |
| hi | Hindi |
| hu | Hungarian |
| is | Icelandic |
| id | Indonesian |
| it | Italian |
| ja | Japanese |
| ko | Korean |
| la | Latin |
| lv | Latvian |
| mk | Macedonian |
| no | Norwegian |
| pl | Polish |
| pt | Portuguese |
| pt-br | Portuguese (Brazil) |
| ro | Romanian |
| ru | Russian |
| sr | Serbian |
| sk | Slovak |
| es | Spanish |
| es-es | Spanish (Spain) |
| es-us | Spanish (United States) |
| sw | Swahili |
| sv | Swedish |
| ta | Tamil |
| th | Thai |
| tr | Turkish |
| vi | Vietnamese |
| cy | Welsh |

Action is:

	/[Room name]/say/[phrase][/[language_code]][/[announce volume]]
	/sayall/[phrase][/[language_code]][/[announce volume]]

#### macOS say command
On macOS the "say" command can be used for text to speech. If your installation runs on macOS you can activate the system TTS by giving an empty configuration:

```json
{
  "macSay": {}
}
```

Or you can provide a default voice and a speech rate:

```json
{
  "macSay": {
  	"voice" : "Alex",
  	"rate": 90
  }
}
```

Action is:

	/[Room name]/say/[phrase][/[voice]][/[announce volume]]
	/sayall/[phrase][/[voice]][/[announce volume]]

Example:

	/Office/say/Hello, dinner is ready
	/Office/say/Hello, dinner is ready/Agnes
	/Office/say/Guten morgen/Anna
	/sayall/Hello, dinner is ready
	/Office/say/Hello, dinner is ready/90
	/Office/say/Guten morgen/Anna/90

Supported voices are:

Alex, Alice, Alva, Amelie, Anna, Carmit, Damayanti, Daniel, Diego, Ellen, Fiona, Fred, Ioana, Joana, Jorge, Juan, Kanya, Karen, Kyoko, Laura, Lekha, Luca, Luciana, Maged, Mariska, Mei-Jia, Melina, Milena, Moira, Monica, Nora, Paulina, Samantha, Sara, Satu, Sin-ji, Tessa, Thomas, Ting-Ting, Veena, Victoria, Xander, Yelda, Yuna, Yuri, Zosia, Zuzana

A list of available voices can be printed by this command:
```
   say -v '?'
```

See also https://gist.github.com/mculp/4b95752e25c456d425c6 and https://stackoverflow.com/questions/1489800/getting-list-of-mac-text-to-speech-voices-programmatically

To download more voices go to: System Preferences -> Accessibility -> Speech -> System Voice

Line-in
-------

Convenience method for selecting line in. Will select linein for zone-group, not detach it for line-in.
Optional parameter is line-in from another player. Examples:

`/Office/linein`
Selects line-in on zone Office belongs to, with source Office.

`/Office/linein/TV%20Room`
Selects line-in for zone Office belongs to, with source TV Room.

If you want to to isolate a player and then select line-in, use the `/Office/leave` first.

Clip
----

Like "Say" but instead of a phrase, reference a custom track from the `static/clips` folder. There is a sample file available (courtesy of https://www.sound-ideas.com/).

    /{Room name}/clip/{filename}[/{announce volume}]
    /clipall/{filename}[/{announce volume}]

Examples:

    /clipall/sample_clip.mp3
    /clipall/sample_clip.mp3/80
    /Office/clip/sample_clip.mp3
    /Office/clip/sample_clip.mp3/30

*Pro-tip: announce your arrival with an epic theme song!*

Grouping
--------

You have basic grouping capabilities. `join` will join the selected player to the specified group (specify group by addressing any of the players in that group):

`/Kitchen/join/Office`
This will join the Kitchen player to the group that Office currently belong to.

`/Kitchen/leave`
Kitchen will leave any group it was part of and become a standalone player.

You don't have to ungroup a player in order to join it to another group, just join it to the new group and it will jump accordingly.

SUB
---

SUB actions include the following:
`/TV%20Room/sub/off`
Turn off sub

`/TV%20Room/sub/on`
Turn on sub

`/TV%20Room/sub/gain/3`
Adjust gain, -15 to 15. You can make bigger adjustments, but I'm limiting it for now because it might damage the SUB.

`/TV%20Room/sub/crossover/90`
adjust crossover frequency in hz. Official values are 50 through 110 in increments of 10. Use other values at your own risk! My SUB gave a loud bang and shut down when setting this to high, and I thought I broke it. However, a restart woke it up again.

`/TV%20Room/sub/polarity/1`
Switch "placement adjustment" or more commonly known as phase. 0 = 0°, 1 = 180°

Spotify, Apple Music and Amazon Music (Experimental)
----------------------

Allows you to perform your own external searches for Spotify, Apple Music or Amazon Music songs or albums and play a specified song or track ID. The Music Search funtionality outlined further below performs a search of its own and plays the specified music.

Ensure you have added and registered the respective service with your Sonos account, before trying to control your speakers with node-sonos-http-api. Instructions on how to do this can be found here: https://support.sonos.com/s/article/2757?language=en_US

The following endpoints are available:

```
# Spotify
/RoomName/spotify/now/spotify:track:4LI1ykYGFCcXPWkrpcU7hn
/RoomName/spotify/next/spotify:track:4LI1ykYGFCcXPWkrpcU7hn
/RoomName/spotify/queue/spotify:track:4LI1ykYGFCcXPWkrpcU7hn

# Apple Music
/RoomName/applemusic/{now,next,queue}/song:{songID}
/RoomName/applemusic/{now,next,queue}/album:{albumID}
/RoomName/applemusic/{now,next,queue}/playlist:{playlistID}

# Amazon Music
/RoomName/amazonmusic/{now,next,queue}/song:{songID}
/RoomName/amazonmusic/{now,next,queue}/album:{albumID}
```

**Spotify**

You can find the **Spotify** track and album IDs as the last part of the URL. 

How to find the URL?
- Web player: the address bar URL for albums and playlist; select _Copy Song Link_ from the dot menu. 
- Desktop client: via _Share > Copy {Album,Playlist,Song} Link_
- Mobile client: via _Share > Copy Link_

For Spotify playlists, you'll need this format: `spotify:user:spotify:playlist:{playlistid}`. Even if it's a public playlist, you always need to prefix with `spotify:user:`. An example of a great playlist: `/kitchen/spotify/now/spotify:user:spotify:playlist:32O0SSXDNWDrMievPkV0Im`.

To get more technical, you actually use the Spotify URI (not URL) for the endpoint, like so: `{room}/spotify/{now,next,queue}/{spotifyuri}`.

It only handles a single **spotify** account currently. It will probably use the first account added on your system.

**Apple Music**

You can find **Apple Music** song and album IDs via the [iTunes Search
API](https://affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api/).

You can also use iTunes to figure out song, album, and playlist IDs. Right click on a song, album, or playlist and select "Share" -> "Copy Link". You can do this when you searched within Apple Music or from your media library as long as the song is available in Apple Music.

Have a look at the link you just copied. 

*If you shared the link to a song:*
The format is: https://itunes.apple.com/{countryCode}/album/{songName}/{albumID}?i={songID}
> eg: https://itunes.apple.com/de/album/blood-of-my-enemies/355363490?i=355364259

*If you shared the link to an album:*
The format is: https://itunes.apple.com/{countryCode}/album/{albumName}/{albumID}
> eg: https://itunes.apple.com/de/album/f-g-restless/355363490

*If you shared the link to a playlist:*
The format is: https://itunes.apple.com/{countryCode}/playlist/{playlistName}/{playlistID}
> eg: https://music.apple.com/gb/playlist/lofi-girls-favorites/pl.ed52c9eeaa0740079c21fa8e455b225e


**Amazon Music**

To find **Amazon Music** song and album IDs you can use the Amazon Music App, search for a song or an album and share a link.

Look at the link you just shared. This works with Amazon Music Prime as well as with Amazon Music Prime which is included in your Amazon Prime membership. 

*If you shared the link to a song:*
The format is: https://music.amazon.de/albums/{albumID}?trackAsin={songID}&ref=dm_sh_d74d-4daa-dmcp-63cb-e8747&musicTerritory=DE&marketplaceId=A1PA6795UKMFR9
> eg: https://music.amazon.de/albums/B0727SH7LW?trackAsin=B071918VCR&ref=dm_sh_d74d-4daa-dmcp-63cb-e8747&musicTerritory=DE&marketplaceId=A1PA6795UKMFR9

*If you shared the link to an album:*
The format is: https://music.amazon.de/albums/{albumID}?ref=dm_sh_97aa-255b-dmcp-c6ba-4ff00&musicTerritory=DE&marketplaceId=A1PA6795UKMFR9
> eg: https://music.amazon.de/albums/B0727SH7LW?ref=dm_sh_97aa-255b-dmcp-c6ba-4ff00&musicTerritory=DE&marketplaceId=A1PA6795UKMFR9

BBC Sounds (as of 2022 only available in the UK)
----------------------
Ensure you have added and registered the BBC Sounds service with your Sonos account, before trying to control your speakers with node-sonos-http-api. Instructions on how to do this can be found here: https://www.bbc.co.uk/sounds/help/questions/listening-on-a-smart-speaker/sonos or here: https://support.sonos.com/s/article/2757?language=en_US

You can specify a BBC station and the station will be played or set depending on the command used.

To play immediately:
```
/RoomName/bbcsounds/play/{stream code}
```
To set the station without playing:
```
/RoomName/bbcsounds/set/{stream code}
```

Refer to the table below for available codes for BBC Radio Stations

|  BBC Radio Station Name          | Stream Code                      |
|----------------------------------|----------------------------------|
|  BBC Radio 1                     | bbc_radio_one                    |
|  BBC 1Xtra                       | bbc_1xtra                        |
|  BBC 1Dance                      | bbc_radio_one_dance              |
|  BBC 1Relax                      | bbc_radio_one_relax              |
|  BBC Radio 2                     | bbc_radio_two                    |
|  BBC Radio 3                     | bbc_radio_three                  |
|  BBC Radio 4 FM                  | bbc_radio_fourfm                 |
|  BBC Radio 4 LW                  | bbc_radio_fourlw                 |
|  BBC Radio 4 Extra               | bbc_radio_four_extra             |
|  BBC Radio 5 Live                | bbc_radio_five_live              |
|  BBC Radio 5 Live Sports Extra   | bbc_five_live_sports_extra       |
|  BBC Radio 6 Music               | bbc_6music                       |
|  BBC Asian Network               | bbc_asian_network                |
|  BBC Radio Berkshire             | bbc_radio_berkshire              |
|  BBC Radio Bristol               | bbc_radio_bristol                |
|  BBC Radio Cambridge             | bbc_radio_cambridge              |
|  BBC Radio Cornwall              | bbc_radio_cornwall               |
|  BBC Radio Cumbria               | bbc_radio_cumbria                |
|  BBC Radio Cymru                 | bbc_radio_cymru                  |
|  BBC Radio Cymru 2               | bbc_radio_cymru_2                |
|  BBC Radio CWR                   | bbc_radio_coventry_warwickshire  |
|  BBC Radio Derby                 | bbc_radio_derby                  |
|  BBC Radio Devon                 | bbc_radio_devon                  |
|  BBC Radio Essex                 | bbc_radio_essex                  |
|  BBC Radio Foyle                 | bbc_radio_foyle                  |
|  BBC Radio Gloucestershire       | bbc_radio_gloucestershire        |
|  BBC Radio Guernsey              | bbc_radio_guernsey               |
|  BBC Radio Hereford Worcester    | bbc_radio_hereford_worcester     |
|  BBC Radio Humberside            | bbc_radio_humberside             |
|  BBC Radio Jersey                | bbc_radio_jersey                 |
|  BBC Radio Kent                  | bbc_radio_kent                   |
|  BBC Radio Lancashire            | bbc_radio_lancashire             |
|  BBC Radio Leeds                 | bbc_radio_leeds                  |
|  BBC Radio Leicester             | bbc_radio_leicester              |
|  BBC Radio Lincolnshire          | bbc_radio_lincolnshire           |
|  BBC Radio London                | bbc_london                       |
|  BBC Radio Manchester            | bbc_radio_manchester             |
|  BBC Radio Merseyside            | bbc_radio_merseyside             |
|  BBC Radio nan Gaidheal          | bbc_radio_nan_gaidheal           |
|  BBC Radio Newcastle             | bbc_radio_newcastle              |
|  BBC Radio Norfolk               | bc_radio_norfolk                 |
|  BBC Radio Northampton           | bbc_radio_northampton            |
|  BBC Radio Nottingham            | bbc_radio_nottingham             |
|  BBC Radio Oxford                | bbc_radio_oxford                 |
|  BBC Radio Scotland FM           | bbc_radio_scotland_fm            |
|  BBC Radio Scotland Extra        | bbc_radio_scotland_mw            | 
|  BBC Radio Sheffield             | bbc_radio_sheffield              |
|  BBC Radio Shropshire            | bbc_radio_shropshire             |
|  BBC Radio Solent                | bbc_radio_solent                 |
|  BBC Radio Somerset              | bbc_radio_somerset_sound         |
|  BBC Radio Stoke                 | bbc_radio_stoke                  |
|  BBC Radio Suffolk               | bbc_radio_suffolk                |
|  BBC Radio Surrey                | bbc_radio_surrey                 |
|  BBC Radio Sussex                | bbc_radio_sussex                 |
|  BBC Radio Tees                  | bbc_tees                         |
|  BBC Radio Three Counties Radio  | bbc_three_counties_radio         |
|  BBC Radio Ulster                | bbc_radio_ulster                 |
|  BBC Radio Wales                 | bbc_radio_wales_fm               |
|  BBC Radio Wales Extra           | bbc_radio_wales_am               |
|  BBC Radio Wiltshire             | bbc_radio_wiltshire              |
|  BBC Radio WM                    | bbc_wm                           |
|  BBC Radio York                  | bbc_radio_york                   |
|  BBC World_Service               | bbc_world_service                |
|  Cbeebies Radio                  | cbeebies_radio                   |

SiriusXM
----------------------
You can specify a SiriusXM channel number or station name and the station will be played.

```
/RoomName/siriusXM/{channel number,station name}
```


Pandora
----------------------
Perform a search for one of your Pandora stations and begin playing. Give the currently playing song a thumbs up or thumbs down. Requires a valid Pandora account and credentials.

The following endpoints are available:

```
/RoomName/pandora/play/{station name}     Plays the closest match to the specified station name in your list of Pandora stations
/RoomName/pandora/thumbsup                Gives the current playing Pandora song a thumbs up
/RoomName/pandora/thumbsdown              Gives the current playing Pandora song a thumbs down
```

Your Pandora credentials need to be added to the settings.json file
   ```
          ,
          "pandora": {
            "username": "your-pandora-account-email-address",
            "password": "your-pandora-password"
          }
  ```


Tunein
----------------------
Given a station id this will play or set the streaming broadcast via the tunein service. You can find tunein station ids via services like [radiotime](http://opml.radiotime.com/)

The following endpoint is available:

```
/RoomName/tunein/play/{station id}
Will set and start playing given Station id

/RoomName/tunein/set/{station id}
Will set without start playing given Station id
```

For example to play Radio 6 Music - [tunein.com/radio/s44491](https://tunein.com/radio/s44491)

```
/RoomName/tunein/play/44491
note the droping of the 's' in 's44491'
```

Music Search and Play
----------------------
Perform a search for a song, artist, album or station and begin playing. Supports Apple Music, Spotify, Deezer, Deezer Elite, and your local Music Library.

The following endpoint is available:

```
/RoomName/musicsearch/{service}/{type}/{search term}

Service options: apple, spotify, deezer, elite, library

Type options for apple, spotify, deezer, and elite: album, song, station, playlist
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
the queue and start playing it. More than 50 tracks can be loaded from the local library by using
library.randomQueueLimit in the settings.json file to set the maximum to a higher value.

Examples:
/Den/musicsearch/spotify/song/red+hot+chili+peppers
/Kitchen/musicsearch/apple/song/dark+necessities
/Playroom/musicsearch/library/song/red+hot+chili+peppers+dark+necessities

/Den/musicsearch/spotify/album/abbey+road
/Playroom/musicsearch/library/album/red+hot+chili+peppers+the+getaway
/Kitchen/musicsearch/spotify/album/dark+necessities

/Kitchen/musicsearch/spotify/playlist/morning+acoustic
/Kitchen/musicsearch/spotify/playlist/dinner+with+friends

/Den/musicsearch/spotify/station/red+hot+chili+peppers
/Kitchen/musicsearch/apple/station/dark+necessities  (Only Apple Music supports song titles)
/Playroom/musicsearch/apple/station/red+hot+chili+peppers+dark+necessities  (Only Apple Music supports song titles)

/Kitchen/musicsearch/library/load  (Loads or reloads the music library from Sonos)
```


Experiment with these and leave feedback!

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

```
{
  "type": "volume-change",
  "data": {
    "uuid": "RINCON_000000000000001400",
    "previousVolume": 14,
    "newVolume": 16,
    "roomName": "Office"
  }
}
```

```
{
  "type": "mute-change",
  "data": {
    "uuid": "RINCON_000000000000001400",
    "previousMute": true,
    "previousMute": false,
    "roomName": "Office"
  }
}
```

"data" property will be equal to the same data as you would get from /RoomName/state or /zones. There is an example endpoint in the root if this project called test_endpoint.js which you may fire up to get an understanding of what is posted, just invoke it with "node test_endpoint.js" in a terminal, and then start the http-api in another terminal.


Server Sent Events
-----

As an alternative to the web hook you can also call the `/events` endpoint to receive every state change and topology change as [Server Sent Event](https://html.spec.whatwg.org/multipage/server-sent-events.html#server-sent-events).
Compared to the web hook there is no configuration required on the server, and you can listen for events from multiple clients.

Because it is a long-polling connection, you must take care of errors in your client code and re-connect if necessary.

The server sends events formatted as single-line JSON in the format of Server Sent Events: every event starts with the string `data: `, followed by the single-line JSON formatted event, and is terminated by two new line characters.

There are [several client libraries available](https://en.wikipedia.org/wiki/Server-sent_events#Libraries) to listen for Server Sent Events.
Using `curl` yields the following output for some volume changes:

```shell
host:~ user$ curl localhost:5005/events
data: {"type":"volume-change","data":{"uuid":"RINCON_E2832F58D9074C45B","previousVolume":13,"newVolume":19,"roomName":"Office"}}

data: {"type":"volume-change","data":{"uuid":"RINCON_E2832F58D9074C45B","previousVolume":19,"newVolume":25,"roomName":"Office"}}

data: {"type":"volume-change","data":{"uuid":"RINCON_E2832F58D9074C45B","previousVolume":25,"newVolume":24,"roomName":"Office"}}

data: {"type":"volume-change","data":{"uuid":"RINCON_E2832F58D9074C45B","previousVolume":23,"newVolume":23,"roomName":"Office"}}

```

DOCKER
-----

Docker usage is maintained by [Chris Nesbitt-Smith](https://github.com/chrisns) at [chrisns/docker-node-sonos-http-api](https://github.com/chrisns/docker-node-sonos-http-api)

## FIREWALL

If you are running this in an environment where you manually have to unblock traffic to and from the machine, the following traffic needs to be allowed:

### Incoming
```
TCP, port 3500 (Sonos events)
UDP, port 1905 (Sonos initial discovery)
TCP, port 5005 (if using the default api port)
TCP, port 5006 (if using https support, optional)
```
### Outgoing
```
TCP, port 1400 (Sonos control commands)
UDP, port 1900 (Sonos initial discovery)
TCP, whatever port used for webhooks (optional)
TCP, port 80/443 (for looking up hig res cover arts on various music services)
```

The UDP traffic is a mixture of multicast (outgoing), broadcast (outgoing) and unicast (incoming). The multicast address is 239.255.255.250, the broadcast is 255.255.255.255 and the unicast is from the Sonos players.

If port 3500 is occupied while trying to bind it, it will try using 3501, 3502, 3503 etc. You would need to adjust your firewall rules accordingly, if running multiple instances of this software, or any other software utilizing these ports. 

### Projects built with this API

**Alexa For Sonos (Alexa Skills)**

Amazon Alexa voice layer on top of the amazing NodeJS component
https://github.com/hypermoose/AlexaForSonos

**Echo Sonos (Alexa Skills)**

Amazon Echo integration with Sonos
https://github.com/rgraciano/echo-sonos

**JukeBot (Ruby)**

A Slack bot that can control a Sonos instance. Custom spotify integration to find music.
https://github.com/estiens/jukebot

**Sonos Controller (JS / Electron)**

A Sonos controller, built with the Electron framework.
https://github.com/anton-christensen/sonos-controller

**Sonos Cron (PHP)**

Service for retrieving commands from an AWS SQS queue and passing them to an instance of the Sonos HTTP API 
https://github.com/cjrpaterson/sonos-cron

**Sonos Push Server (JS)**

A Node server to receive notifications from node-sonos-http-api and push them via socket.io to the clients. 
https://github.com/TimoKorinth/sonos-push-server

**SonoBoss (Siri Shortcut)**

A ChatGPT-assisted Siri Shortcut that acts as a virtual assistant to let you find music and control Sonos through voice and chat.
https://github.com/Barloew/SonoBoss

