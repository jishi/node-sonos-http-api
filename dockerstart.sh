mkdir -p /sonos
cd /sonos

# try to remove the repo if it already exists
rm -rf node-sonos-http-api; true
ln -s /usr/bin/nodejs /usr/bin/node

git clone https://github.com/jishi/node-sonos-http-api

cd node-sonos-http-api

npm install
npm install -g pm2

pm2 start server.js -x --name "http-api"
pm2 logs
