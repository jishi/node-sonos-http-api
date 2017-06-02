'use strict';

const toBase64 = (string) => new Buffer(string).toString('base64');
module.exports = toBase64;
