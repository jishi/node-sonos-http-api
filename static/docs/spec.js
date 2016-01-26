var spec = 
{
  "swagger": "2.0",
  "info": {
    "description": "An interactive explorer for the Sonos music system from <a href=\\\"https://github.com/jishi\\\">@jishi</a>",
    "version": "1.0.0",
    "title": "Sonos API Explorer",
    "termsOfService": "https://github.com/jishi/node-sonos-http-api",
    "license": {
      "name": "MIT License",
      "url": "https://github.com/jishi/node-sonos-http-api/blob/master/LICENSE.md"
    }
  },
  "basePath": "/",
  "schemes": [
    "http"
  ],
  "paths": {
    "/lockvolumes": {
      "get": {
        "tags": [
          "sonos"
        ],
        "summary": "experimental",
        "operationId": "lockVolumes",
        "responses": {
          "default": {
            "description": "success"
          }
        }
      }
    },
    "/pauseall/{delayInMinutes}": {
      "get": {
        "tags": [
          "sonos"
        ],
        "summary": "pauses all controllers",
        "operationId": "pauseAll",
        "parameters": [
          {
            "in": "path",
            "name": "delayInMinutes",
            "required": true,
            "type": "integer",
            "format": "int32",
            "default": 0
          }
        ],
        "responses": {
          "default": {
            "description": "success"
          }
        }
      }
    },
    "/preset/{jsonPreset}": {
      "get": {
        "tags": [
          "sonos"
        ],
        "summary": "executes a preset list",
        "operationId": "executePreset",
        "parameters": [
          {
            "in": "path",
            "name": "jsonPreset",
            "required": true,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responses": {
          "default": {
            "description": "success"
          }
        }
      }
    },
    "/resumeall/{delayInMinutes}": {
      "get": {
        "tags": [
          "sonos"
        ],
        "summary": "resumes all controllers",
        "operationId": "resumeAll",
        "parameters": [
          {
            "in": "path",
            "name": "delayInMinutes",
            "required": true,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responses": {
          "default": {
            "description": "success"
          }
        }
      }
    },
    "/unlockvolumes": {
      "get": {
        "tags": [
          "sonos"
        ],
        "summary": "experimental",
        "operationId": "unlockVolumes",
        "responses": {
          "default": {
            "description": "success"
          }
        }
      }
    },
    "/zones": {
      "get": {
        "tags": [
          "sonos"
        ],
        "summary": "get zones in system",
        "operationId": "getZones",
        "responses": {
          "default": {
            "description": "success",
            "schema": {
              "type": "array",
              "items": {
                "$ref": "Zone"
              }
            }
          }
        }
      }
    },
    "/{room}/{action}": {
      "get": {
        "tags": [
          "sonos"
        ],
        "summary": "executes an action on a room",
        "operationId": "roomAction",
        "parameters": [
          {
            "in": "path",
            "name": "room",
            "required": true,
            "type": "string"
          },
          {
            "in": "path",
            "name": "action",
            "required": true,
            "type": "string"
          }
        ],
        "responses": {
          "default": {
            "description": "success"
          }
        }
      }
    },
    "/{room}/{action}/{parameter}": {
      "get": {
        "tags": [
          "sonos"
        ],
        "summary": "executes an action on a room with parameters",
        "operationId": "roomActionWithParameter",
        "parameters": [
          {
            "in": "path",
            "name": "room",
            "required": true,
            "type": "string"
          },
          {
            "in": "path",
            "name": "action",
            "required": true,
            "type": "string"
          },
          {
            "in": "path",
            "name": "parameter",
            "description": "volume => abs or incremental, favorite => name, repeat => on/off",
            "required": true,
            "type": "string"
          }
        ],
        "responses": {
          "default": {
            "description": "success"
          }
        }
      }
    }
  },
  "definitions": {
    "GroupState": {
      "properties": {
        "volume": {
          "type": "integer",
          "format": "int32"
        },
        "mute": {
          "type": "boolean"
        }
      }
    },
    "State": {
      "properties": {
        "currentTrack": {
          "$ref": "Track"
        },
        "nextTrack": {
          "$ref": "Track"
        },
        "volume": {
          "type": "integer",
          "format": "int32"
        },
        "mute": {
          "type": "boolean"
        },
        "trackNo": {
          "type": "integer",
          "format": "int32"
        },
        "elapsedTime": {
          "type": "integer",
          "format": "int32"
        },
        "elapsedTimeFormatted": {
          "type": "string"
        },
        "zoneState": {
          "type": "string"
        },
        "playerState": {
          "type": "string"
        }
      }
    },
    "PlayMode": {
      "properties": {
        "suffle": {
          "type": "boolean"
        },
        "repeat": {
          "type": "boolean"
        },
        "crossfade": {
          "type": "string"
        }
      }
    },
    "Zone": {
      "properties": {
        "uuid": {
          "type": "string",
          "description": "a unique identifier for the zone"
        },
        "coordinator": {
          "$ref": "Coordinator"
        }
      },
      "description": "A single sonos zone"
    },
    "Track": {
      "properties": {
        "artist": {
          "type": "string"
        },
        "title": {
          "type": "string"
        },
        "album": {
          "type": "string"
        },
        "albumArtURI": {
          "type": "string"
        },
        "duration": {
          "type": "integer",
          "format": "int32"
        },
        "uri": {
          "type": "string"
        }
      }
    },
    "Coordinator": {
      "properties": {
        "uuid": {
          "type": "string",
          "description": "unique identifier for a coordinator"
        },
        "state": {
          "$ref": "State"
        },
        "playMode": {
          "$ref": "PlayMode"
        },
        "roomName": {
          "type": "string"
        },
        "coordinator": {
          "type": "string"
        },
        "groupState": {
          "$ref": "#/definitions/GroupState"
        }
      }
    }
  }
}
