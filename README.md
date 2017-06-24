Swagger Express Validator
=========================

[![Build Status](https://travis-ci.org/gargol/swagger-express-validator.svg?branch=master)](https://travis-ci.org/gargol/swagger-express-validator)

`swagger-express-validator` is a lightweight middleware for request/response validation based on 
[OpenAPI v2.0](http://swagger.io/specification/) (aka swagger) specification. 

The main difference of this package to alternatives like 
[swagger-tools](https://github.com/apigee-127/swagger-tools) is that this package is very
configurable and only concentrates on validation against provided schema. You can choose the 
behavior of invalid validation like returning a 500 or just logging an error to your logger.

## Requirements
- express ^4.0.0
- body-parser ^1.0.0

## Features
* Configurable validation behavior
* [Fastest](https://github.com/ebdrup/json-schema-benchmark) available JSON schema validation based on [ajv](https://github.com/epoberezkin/ajv) library
* Optional validations for either request parameters or response values
* Independent from express application structure. This is a simple drop-in middleware without additional
 alterations to your swagger definitions or application routing.
* Support for nullable field validation though `x-nullable` attribute
 
## Installation
Start using this library with `npm install swagger-express-validator --save`

## Sample use
To set up simple validation for your requests and responses:
```javascript
const util = require('util');
const express = require('express');
const bodyParser = require('body-parser');
const validator = require('swagger-express-validator');
const schema = require('./api-schema.json');

const server = express();
server.use(bodyParser.json());

const opts = {
  schema,
  validateRequest: true,
  validateResponse: true,
  requestValidationFn: (req, data, errors) => {
    console.log(`failed request validation: ${req.method} ${req.originalUrl}\n ${util.inspect(errors)}`)
  },
  responseValidationFn: (req, data, errors) => {
    console.log(`failed response validation: ${req.method} ${req.originalUrl}\n ${util.inspect(errors)}`)
  },
};
server.use(validator(opts));

server.use('/status', (req, res) => {
  res.json({
    status: 'OK',
  })
});
server.use((err, req, res, next) => {
  res.status(500);
  res.json(err);
});

return server.listen(3000);

```

## Debugging
To see debug output use `DEBUG=swagger-express-validator` as an environmental varialbe when starting
your project, eg.: `DEBUG=swagger-express-validator node server.js`. To gain more insights
on how this works see documentation of [debug](https://github.com/visionmedia/debug) library

## Contributors
- [Nazar Gargol](https://github.com/gargol)
- [Isaac Stefanek](https://github.com/iadknet)

## Licence
[MIT](https://github.com/gargol/swagger-express-validator/blob/master/LICENSE)

Special thanks to @bgaluszka for initial inspiration :)

