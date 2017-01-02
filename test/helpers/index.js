const express = require('express');
const validator = require('../..');

const createServer = (requestHandler, schema) => {
  const server = express();
  server.use(validator({ schema, responseValidation: true }));
  server.use('/', requestHandler);

  return server.listen(3000);
};

module.exports = {
  createServer,
};
