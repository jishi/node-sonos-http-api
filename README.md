SONOS HTTP API
==============

A simple http based API for controlling your Sonos system.

USAGE
=====

Start by fixing your dependencies. Invoke the following command:

npm install

This will download the necessary dependencies if possible (you will need git for this)

start the server by running

node server.js

Now you can control your system by invoking the following commands:

http://localhost:5005/{room name}/{action}[/{parameter}]

Example:

http://localhost:5005/living room/volume/15
(will set volume for room Living Room to 15%)

http://localhost:5005/living room/volume/+1
(will increase volume by 1%)

http://localhost:5005/living room/next
(will skip to the next track on living room, unless it's not a coordinator)

http://localhost:5005/living room/pause
(will pause the living room)

The actions supported as of today:

play
pause
volume (parameter is absolute or relative volume. Prefix +/- indicates relative volume)
seek (parameter is queue index)
next
previous
