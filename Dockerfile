# LoopBox main processor

# Base image
FROM node:7

ENV WORKINGDIR /app
WORKDIR ${WORKINGDIR}

# Install NPM modules, only copy package.json so only changes to modules 
# will kick off this step.
COPY package.json ${WORKINGDIR}/
RUN npm config set loglevel warn && \
    npm set progress=false && \
    npm install -q --production

# cache, presets, and static
COPY static/ ${WORKINGDIR}/static/
COPY cache/ ${WORKINGDIR}/cache/
COPY presets/ ${WORKINGDIR}/presets/

# Copy settings
COPY settings.json ${WORKINGDIR}/
COPY settings.js ${WORKINGDIR}/

# Copy server code
COPY server.js ${WORKINGDIR}/
COPY lib/ ${WORKINGDIR}/lib/

# 'Start' the server
ENV PORT 8082
EXPOSE 8082
CMD ["node", "./server.js"]
