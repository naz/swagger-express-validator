const _ = require('lodash');
const debug = require('debug')('swagger-express-validator');
const Ajv = require('ajv');
const util = require('util');
const parseUrl = require('url').parse;
const pathToRegexp = require('path-to-regexp');
const valueValidator = require('validator');

let pathObjects = [];
let options = {};
let ajvRequestOptions;
let ajvResponseOptions;

const buildPathObjects = paths => _.map(paths, (pathDef, path) => ({
  definition: _.get(options.schema, ['paths', path]),
  original: ['paths', path],
  regexp: pathToRegexp(path.replace(/\{/g, ':').replace(/\}/g, '')),
  path,
  pathDef,
}));

const removeBasePath = (basePath, url) => (url.indexOf(basePath) === 0
  ? url.replace(basePath, '')
  : url);

const normalizeUrl = (url) => {
  if (options.schema.basePath) {
    return removeBasePath(options.schema.basePath, url);
  }
  return url;
};


const matchUrlWithSchema = (reqUrl) => {
  const url = normalizeUrl(parseUrl(reqUrl).pathname);
  const pathObj = pathObjects.filter(obj => url.match(obj.regexp));
  let match = null;
  if (pathObj[0]) {
    match = pathObj[0].definition;
  }
  return match;
};

const decorateWithNullable = (schema) => {
  if (schema && schema.properties) {
    Object.keys(schema.properties).forEach((prop) => {
      if (schema.properties[prop]['x-nullable']) {
        schema.properties[prop] = {
          oneOf: [
            schema.properties[prop],
            { type: 'null' },
          ],
        };
      }
    });
  } else if (schema && schema.items) {
    schema.items = decorateWithNullable(schema.items);
  }
  return schema;
};

const decorateWithDefinitions = (schema) => {
  schema.definitions = _.assign({}, options.schema.definitions || {}, schema.definitions || {});
  return schema;
};

const resolveResponseModelSchema = (req, res) => {
  const pathObj = matchUrlWithSchema(req.originalUrl);
  let schema = null;
  if (pathObj) {
    const method = req.method.toLowerCase();
    if (pathObj[method]) {
      const responseSchemas = pathObj[method].responses;
      const code = res.statusCode || 200;
      if (responseSchemas[code]) {
        ({ schema } = responseSchemas[code]);
      }
    }
  }

  if (options.allowNullable) {
    schema = decorateWithNullable(schema);
  }

  if (options.schema.definitions && schema) {
    schema = decorateWithDefinitions(schema);
  }

  return schema;
};

const resolveRequestModelSchema = (req) => {
  const pathObj = matchUrlWithSchema(req.originalUrl);
  let schema = null;
  if (pathObj) {
    const method = req.method.toLowerCase();
    let requestSchemas = null;
    if (pathObj[method]) {
      requestSchemas = pathObj[method].parameters;
    }
    if (requestSchemas && requestSchemas.length > 0) {
      const bodyParam = _.find(requestSchemas, { in: 'body' });
      schema = bodyParam && bodyParam.schema;
    }
  }
  if (options.allowNullable) {
    schema = decorateWithNullable(schema);
  }
  if (options.schema.definitions && schema) {
    schema = decorateWithDefinitions(schema);
  }
  return schema;
};

const sendData = (res, data, encoding) => {
  // 'res.end' requires a Buffer or String so if it's not one, create a String
  if (!(data instanceof Buffer) && !_.isString(data)) {
    data = JSON.stringify(data);
  }
  res.end(data, encoding);
};

const validateResponse = (req, res, next) => {
  const ajv = new Ajv(Object.assign(
    {},
    {
      allErrors: true,
      formats: {
        int32: valueValidator.isInt,
        int64: valueValidator.isInt,
        url: valueValidator.isURL,
      },
    },
    ajvResponseOptions
  ));

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
    res.write = origWrite;
    res.end = origEnd;

    const responseSchema = resolveResponseModelSchema(req, res);
    if (!responseSchema) {
      debug('Response validation skipped: no matching response schema');
      sendData(res, data, encoding);
    } else {
      let val;

      if (data) {
        if (data instanceof Buffer) {
          writtenData.push(data);
          val = Buffer.concat(writtenData);
        } else if (data instanceof String) {
          writtenData.push(Buffer.from(data));
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

      if (val instanceof Buffer) {
        val = val.toString(encoding);
      }

      if (_.isString(val)) {
        try {
          val = JSON.parse(val);
        } catch (err) {
          if (!options.preserveResponseContentType) {
            res.set('Content-Type', ''); // Reset content-type since it is no longer valid
          }
          err.failedValidation = true;
          err.message = 'Value expected to be an array/object but is not';
          if (options.responseValidationFn) {
            options.responseValidationFn(req, data, [err]);
            sendData(res, data, encoding);
            return;
          }
          const resultError = {
            message: `Response schema validation failed for ${req.method}${req.originalUrl}`,
          };
          if (options.returnResponseErrors) {
            err.errors = [{ message: 'Invalid response format' }];
          }
          next(resultError);
          return;
        }
      }

      const validator = ajv.compile(responseSchema);
      const validation = validator(_.cloneDeep(val));
      if (!validation) {
        debug(`  Response validation errors: \n${util.inspect(validator.errors)}`);
        if (options.responseValidationFn) {
          options.responseValidationFn(req, val, validator.errors);
          sendData(res, val, encoding);
        } else {
          const err = {
            message: `Response schema validation failed for ${req.method}${req.originalUrl}`,
          };
          if (options.returnResponseErrors) {
            err.errors = validator.errors;
          }
          next(err);
        }
      } else {
        debug('Response validation success');
        sendData(res, val, encoding);
      }
    }
  };

  next();
};

const validateRequest = (req, res, next) => {
  const ajv = new Ajv(Object.assign(
    {},
    {
      allErrors: true,
      formats: {
        int32: valueValidator.isInt,
        int64: valueValidator.isInt,
        url: valueValidator.isURL,
      },
    }, ajvRequestOptions
  ));

  const requestSchema = resolveRequestModelSchema(req);

  if (!requestSchema) {
    debug('Request validation skipped: no matching request schema');
    if (options.validateResponse) {
      validateResponse(req, res, next);
    } else {
      next();
    }
  } else {
    const validator = ajv.compile(requestSchema);
    const validation = validator(_.cloneDeep(req.body));
    if (!validation) {
      debug(`  Request validation errors: \n${util.inspect(validator.errors)}`);
      if (options.requestValidationFn) {
        options.requestValidationFn(req, req.body, validator.errors);
        next();
      } else {
        const err = {
          message: `Request schema validation failed for ${req.method}${req.originalUrl}`,
        };
        if (options.returnRequestErrors) {
          err.errors = validator.errors;
        }
        res.status(400);
        res.json(err);
      }
    } else {
      debug('Request validation success');
      if (options.validateResponse) {
        validateResponse(req, res, next);
      } else {
        next();
      }
    }
  }
};

const validate = (req, res, next) => {
  debug(`Processing: ${req.method} ${req.originalUrl}`);

  if (pathObjects.length === 0) {
    next();
  } else if (options.validateRequest) {
    validateRequest(req, res, next);
  } else if (options.validateResponse) {
    validateResponse(req, res, next);
  } else {
    next();
  }
};

/**
 *
 * @param opts
 * @param opts.schema {object} json swagger schema
 * @param opts.validateResponse {boolean|true}
 * @param opts.validateRequest {boolean|true}
 * @param opts.allowNullable {boolean|true}
 * @param opts.requestValidationFn {function}
 * @param opts.responseValidationFn {function}
 * @param [opts.ajvRequestOptions] {object}
 * @param [opts.ajvResponseOptions] {object}
 * @returns {function(*=, *=, *=)}
 */
const init = (opts = {}) => {
  debug('Initializing swagger-express-validator middleware');
  options = _.defaults({}, opts, {
    preserveResponseContentType: true,
    returnResponseErrors: false,
    returnRequestErrors: false,
    validateRequest: true,
    validateResponse: true,
    allowNullable: true,
    ajvRequestOptions: {},
    ajvResponseOptions: {},
  });

  if (options.schema) {
    pathObjects = buildPathObjects(options.schema.paths);
  } else {
    debug('Please provide schema option to properly initialize middleware');
    pathObjects = [];
  }
  ({ ajvRequestOptions, ajvResponseOptions } = opts);

  return validate;
};

module.exports = init;
