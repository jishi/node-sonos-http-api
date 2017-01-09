mkdir -p /sonos
cd /sonos

# try to remove the repo if it already exists
rm -rf node-sonos-http-api; true

git clone https://github.com/jishi/node-sonos-http-api

cd node-sonos-http-api

npm install

npm start
