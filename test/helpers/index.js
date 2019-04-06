const express = require('express');
const HttpStatus = require('http-status-codes');
const bodyParser = require('body-parser');
const testlab = require('middleware-testlab');
const validator = require('../..');

function createServer(requestHandler, opts, endpoint = '/') {
  return testlab.newExpressApp({
    appMiddleware: [
      bodyParser.json(),
      validator(opts)
    ],
    endpoint,
    handler: requestHandler
  });
}

function getOpts(schema, validateRequest, validateResponse) {
  return Object.freeze({
    schema,
    validateRequest,
    validateResponse
  });
}

const createServerLegacy = (requestHandler, opts) => {
  const app = express();
  app.use(bodyParser.json());
  app.use(validator(opts));
  app.use('/', requestHandler);
  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    res.json(err);
  });
  return app;
};

module.exports = {
  createServer,
  createServerLegacy,
  getOpts
};
