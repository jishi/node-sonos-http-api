'use strict';
var request = require('request-promise');
var toBase64 = require('../../helpers/base64.utils');

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

const mapResponse = ({ access_token, token_type, expires_in }) => ({
  accessToken: access_token,
  tokenType: token_type,
  expiresIn: expires_in,
});

const getHeaders = (clientId, clientSecret) => {
  const authString = `${clientId}:${clientSecret}`;
  return {
    Authorization: `Basic ${toBase64(authString)}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
};

const getOptions = (clientId, clientSecret, url) => {
  return {
    url,
    headers: getHeaders(clientId, clientSecret),
    json: true,
    method: 'POST',
    form: {
      grant_type: 'client_credentials',
    },
  };
};

const auth = (clientId, clientSecret) => {
  const options = getOptions(clientId, clientSecret, SPOTIFY_TOKEN_URL);
  return new Promise((resolve, reject) => {
    request(options).then((response) => {
      const responseMapped = mapResponse(response);
      resolve(responseMapped);
    }).catch((err) => {
      reject(new Error(`Unable to authenticate Spotify with client id: ${clientId}`));
    })
  });
};

module.exports = auth;
