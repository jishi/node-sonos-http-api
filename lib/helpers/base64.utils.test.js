var test = require('tape');
var toBase64 = require('./base64.utils');

test('toBase64', assert => {
  assert.equal(toBase64('somestring'), 'c29tZXN0cmluZw==');
  assert.end();
});
