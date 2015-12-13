###############################################
# Debian with sonos http api
###############################################

# Using latest debian image as base (ubuntu is a fat cow)
FROM node:4-slim

MAINTAINER Erik-jan Riemers

RUN apt-get update && \
    apt-get -y install npm git git-core

RUN mkdir /sonos
ADD . /sonos/
RUN cd /sonos && npm install

WORKDIR /sonos/
CMD npm start