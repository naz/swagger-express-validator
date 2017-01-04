const _ = require('lodash');
const debug = require('debug')('swagger-validator');
const HttpStatus = require('http-status-codes');
const Ajv = require('ajv');
const util = require('util');
const parseUrl = require('url').parse;
const pathToRegexp = require('path-to-regexp');

let pathObjects = [];
let options = {};

const buildPathObjects = () => _.map(options.schema.paths, (pathDef, path) => {
  return {
    definition: _.get(options.schema, ['paths', path]),
    original: ['paths', path],
    regexp: pathToRegexp(path.replace(/\{/g, ':').replace(/\}/g, '')),
    path,
    pathDef,
  };
});

const matchUrlWithSchema = (reqUrl) => {
  const url = parseUrl(reqUrl).pathname;
  const pathObj = pathObjects.filter(obj => url.match(obj.regexp));
  let match = null;
  if (pathObj[0]) {
    match = pathObj[0].definition;
  }
  return match;
};

const resolveResponseModelSchema = (req, res) => {
  const pathObj = matchUrlWithSchema(req.url);
  let statusSchema = null;
  if (pathObj) {
    const method = req.method.toLowerCase();
    const responseSchemas = pathObj[method].responses;
    const code = res.statusCode || 200;
    if(responseSchemas[code]) {
      statusSchema = responseSchemas[code].schema;
    }
  }

  return statusSchema;
};

/**
 *
 * @param opts
 * @param opts.validateResponse {boolean|true}
 * @param opts.validateRequest {boolean|false}
 * @param opts.responseValidationFn {function}
 * @returns {function(*=, *=, *=)}
 */
const init = (opts = {}) => {
  debug('Initializing swagger-express-validator middleware');
  options = opts;
  if (_.isUndefined(options.validateResponse)) {
    options.validateResponse = true;
  }
  if (_.isUndefined(options.validateRequest)) {
    options.validateRequest = false;
  }
  pathObjects = buildPathObjects(opts.spec);

  return validate;
};

const validate = (req, res, next) => {
  debug(`Processing: ${req.method} ${req.url}`);

  if (options.validateRequest) {
    validateRequest(req, res, next);
  }
  if (options.validateResponse) {
    validateResponse(req, res, next);
  }
};

const validateRequest = (req, res, next) => {
  next();
};

const validateResponse = (req, res, next) => {
  const ajv = new Ajv({});
  const responseSchema = resolveResponseModelSchema(req, res);
  if (!responseSchema) {
    debug('Response validation skipped: no matching response schema');
  } else {
    const validate = ajv.compile(responseSchema);

    const orig = res.json;
    // eslint-disable-next-line
    res.json = function json(data) {
      const validation = validate(data);
      if (!validation) {
        debug(`  Response validation errors: \n${util.inspect(validate.errors)}`);
        if (options.responseValidationFn) {
          options.responseValidationFn(req, data, validate.errors);
          orig.call(this, data);
        } else {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR);
          const args = {
            code: HttpStatus.INTERNAL_SERVER_ERROR,
            message: `response schema validation failed for ${req.method}${req.url}`,
          };
          orig.call(this, args);
        }
      } else {
        debug('Response validation success');
        orig.call(this, data);
      }
    };
  }

  next();
};

module.exports = init;

