FROM node:6-alpine

WORKDIR /app
COPY . .

RUN mkdir cache && \
  ln -s settings/settings.json && \
  chown -R node:node static cache && \
  npm install --production

EXPOSE 5005

USER node

CMD npm start