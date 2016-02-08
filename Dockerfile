FROM mhart/alpine-node:5.5

ADD package.json /opt/app/
WORKDIR /opt/app
RUN npm install --production
CMD ["npm", "start"]
EXPOSE 3500/tcp 5005/tcp
ADD . /opt/app
