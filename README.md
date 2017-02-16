:boom: WARNING! PACKAGE IS UNDER ACTIVE DEVELOPMENT

[![Build Status](https://travis-ci.org/gargol/swagger-express-validator.svg?branch=master)](https://travis-ci.org/gargol/swagger-express-validator)

`swagger-express-validator` is a lightweight middleware for request/response validation based on 
swagger (2.0) specification. 

The main difference of this package to alternatives like 
[swagger-tools](https://github.com/apigee-127/swagger-tools) is that this package is very
configurable and only concentrates on validation against provided schema. You can choose the 
behavior of invalid validation like returning a 500 or just logging an error to your logger.

## Requirements
- express ^4.0.0
- body-parser ^1.0.0

##Features
* Configurable validation behavior
* [Fastest](https://github.com/ebdrup/json-schema-benchmark) available JSON schema validation based on [ajv](https://github.com/epoberezkin/ajv) library
* Optional validations for either request parameters or response values
* Independent from express application structure. This is a simple drop-in middleware without additional
 alterations to your swagger definitions or application routing.
 
##Installation
Start using this library with `npm install swagger-express-validator --save`

##Debugging
To see debug output use `DEBUG=swagger-express-validator` as an environmental varialbe when starting
your project, eg.: `DEBUG=swagger-express-validator node server.js`. To gain more insights
on how this works see documentation of [debug](https://github.com/visionmedia/debug) library

## Licence
[MIT](https://github.com/gargol/swagger-express-validator/blob/master/LICENSE)

Special thanks to @bgaluszka for inspiration :)

