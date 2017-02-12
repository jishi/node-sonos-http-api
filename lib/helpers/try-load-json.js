const fs = require('fs');
const JSON5 = require('json5');
const logger = require('sonos-discovery/lib/helpers/logger');

function tryLoadJson(path) {
  try {
    const fileContent = fs.readFileSync(path);
    const parsedContent = JSON5.parse(fileContent);
    return parsedContent;
  } catch (e) {
    if (e.code === 'ENOENT') {
      logger.info(`Could not find file ${path}`);
    } else {
      logger.warn(`Could not read file ${path}, ignoring.`, e);
    }
  }
  return {};
}

module.exports = tryLoadJson;