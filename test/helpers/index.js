const express = require('express');
const validator = require('../..');
const bodyParser = require('body-parser');
const HttpStatus = require('http-status-codes');

const createServer = (requestHandler, opts) => {
  const server = express();
  server.use(bodyParser.json());
  server.use(validator(opts));
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
