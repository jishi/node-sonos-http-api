'use strict';

var test = require('tape');
var store = require('./store');

test('set value in store', assert => {
  store.set('foo', 'bar')
  assert.equals(store.get('foo'), 'bar');
  assert.notOk(store.get('foo2'));
  assert.end();
});

test('remove value from store', assert => {
  store.set('foo', 'bar')
  assert.equals(store.get('foo'), 'bar');
  store.remove('foo');
  assert.notOk(store.get('foo'), 'bar');
  assert.end();
});
