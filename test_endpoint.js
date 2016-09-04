'use strict';
const http = require('http');

let server = http.createServer((req, res) => {
  for (let header in req.headers) {
    console.log(header + ':', req.headers[header]);
  }

  console.log('');

  const buffer = [];

  req.on('data', (data) => buffer.push(data.toString()));
  req.on('end', () => {
    res.end();

    const json = JSON.parse(buffer.join(''));
    console.dir(json, {depth: 10});
    console.log('');

  });
});

server.listen(5007);
console.log('Listening on http://localhost:5007/');