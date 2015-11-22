'use strict';
const http = require('http');

let server = http.createServer((req, res) => {
  for (let header in req.headers) {
    console.log(header + ':', req.headers[header]);
  }

  console.log('');
  req.on('data', (data) => console.log(data.toString()));
  req.on('end', () => res.end());
});

server.listen(5006);
console.log('Listening on http://localhost:5006/');