const express = require('express');
const validator = require('../..');
const HttpStatus = require('http-status-codes');

const createServer = (requestHandler, schema) => {
  const server = express();
  server.use(validator({ schema, responseValidation: true }));
  server.use('/', requestHandler);
  server.use((err, req, res, next) => {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    res.json(err);
  });
  return server.listen(3000);
};

module.exports = {
  createServer,
};
