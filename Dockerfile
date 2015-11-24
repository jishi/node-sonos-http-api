###############################################
# Debian with sonos http api
###############################################

# Using latest debian image as base (ubuntu is a fat cow)
FROM node:slim

MAINTAINER Erik-jan Riemers

RUN apt-get update
RUN apt-get -y install npm git git-core

ADD dockerstart.sh /tmp/
RUN chmod +x /tmp/dockerstart.sh
EXPOSE 5005 3500 1901
CMD ./tmp/dockerstart.sh
