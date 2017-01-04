const _ = require('lodash');
const debug = require('debug')('swagger-validator');
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
  const pathObj = matchUrlWithSchema(req.originalUrl);
  let statusSchema = null;
  if (pathObj) {
    const method = req.method.toLowerCase();
    const responseSchemas = pathObj[method].responses;
    const code = res.statusCode || 200;
    if (responseSchemas[code]) {
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
  debug(`Processing: ${req.method} ${req.originalUrl}`);

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

const sendData = (res, data, encoding) => {
  // 'res.end' requires a Buffer or String so if it's not one, create a String
  if (!(data instanceof Buffer) && !_.isString(data)) {
    data = JSON.stringify(data);
  }
  res.end(data, encoding);
};


const validateResponse = (req, res, next) => {
  const ajv = new Ajv({ coerceTypes: true });
  const responseSchema = resolveResponseModelSchema(req, res);
  if (!responseSchema) {
    debug('Response validation skipped: no matching response schema');
  } else {
    const validator = ajv.compile(responseSchema);
    let val;
    const origEnd = res.end;
    const writtenData = [];
    const origWrite = res.write;

    // eslint-disable-next-line
    res.write = function (data) {
      if (typeof data !== 'undefined') {
        writtenData.push(data);
      }
    };

    // eslint-disable-next-line
    res.end = function (data, encoding) {
      if (data) {
        if (data instanceof Buffer) {
          writtenData.push(data);
          val = Buffer.concat(writtenData);
        } else if (data instanceof String) {
          writtenData.push(new Buffer(data));
          val = Buffer.concat(writtenData);
        } else {
          val = data;
        }
      } else if (writtenData.length !== 0) {
        val = Buffer.concat(writtenData);
      }

      if (data instanceof Buffer) {
        debug(data.toString(encoding));
      }

      res.write = origWrite;
      res.end = origEnd;

      if (val instanceof Buffer) {
        val = val.toString(encoding);
      }

      if (_.isString(val)) {
        try {
          val = JSON.parse(val);
        } catch (err) {
          err.failedValidation = true;
          err.message = 'Value expected to be an array/object but is not';

          throw err;
        }
      }

      const validation = validator(val);
      if (!validation) {
        debug(`  Response validation errors: \n${util.inspect(validator.errors)}`);
        if (options.responseValidationFn) {
          options.responseValidationFn(req, val, validator.errors);
          sendData(res, val, encoding);
        } else {
          const err = {
            message: `response schema validation failed for ${req.method}${req.originalUrl}`,
          };
          next(err);
        }
      } else {
        debug('Response validation success');
        sendData(res, val, encoding);
      }
    };
  }

  next();
};

module.exports = init;

