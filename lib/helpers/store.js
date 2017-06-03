'use strict';

const cache = {};

const store = {
  set: (key, value) => {
    cache[key] = value
  },
  get: (key) => cache[key],
  remove: (key) => {
    delete cache[key];
  },
};

module.exports = store;
