FROM mhart/alpine-node:5.11

# install dependencies
COPY package.json /opt/app/
WORKDIR /opt/app
RUN npm install --production

EXPOSE 3500/tcp 5005/tcp

# copy source code
COPY . /opt/app

CMD ["npm", "start"]
