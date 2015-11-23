###############################################
# Debian with sonos http api
###############################################

# Using latest debian image as base (ubuntu is a fat cow)
FROM debian

MAINTAINER Erik-jan Riemers

RUN apt-get update
RUN apt-get install -y nodejs npm git git-core

ADD dockerstart.sh /tmp/
RUN chmod +x /tmp/dockerstart.sh
EXPOSE 5005 3500 1901
CMD ./tmp/dockerstart.sh
