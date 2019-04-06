const request = require('supertest');
const { okHandler } = require('middleware-testlab').handlers.express;

const { getOpts, createServer } = require('./helpers');
const schema = require('./swagger-schemas/basic.json');

const optsValidateResponse = getOpts(schema, false, true);
const optsValidateRequest = getOpts(schema, true, false);
const optsValidateAll = getOpts(schema, true, true);
const optsDoNotValidate = getOpts(schema, false, false);

describe('basic', () => {
  describe('validates basic response', () => {
    it('passes successful response through', (done) => {
      const app = createServer(okHandler, optsValidateResponse, '/status');
      request(app)
        .get('/status')
        .expect(200)
        .end(done);
    });

    it('passes request for invalid URL through', (done) => {
      const app = createServer(okHandler, optsValidateResponse, '/status');
      request(app)
        .get('/invalid')
        .expect(404)
        .end(done);
    });

    it('passes response that is not defined in the schema', (done) => {
      const app = createServer(okHandler, optsValidateResponse, '/route-not-in-schema');
      request(app)
        .get('/route-not-in-schema')
        .expect(200)
        .end(done);
    });

    it('fails with 500 response code due to invalid response object', (done) => {
      const invalidHandler = (req, res) => {
        res.json({
          invalid: 'field',
        });
      };

      const app = createServer(invalidHandler, optsValidateResponse, '/status');
      request(app)
        .get('/status')
        .expect(500)
        .expect((res) => {
          if (!res.body.details.includes('Response schema validation failed')) {
            throw new Error(`invalid response body message for: ${JSON.stringify(res.body)}`);
          }
        })
        .end(done);
    });
  });

  describe('validates basic request', () => {
    it('passes request through when no request body needed', (done) => {
      const app = createServer(okHandler, optsValidateRequest, '/status');
      request(app)
        .get('/status')
        .expect(200)
        .end(done);
    });

    it('passes through when invalid URL', (done) => {
      const app = createServer(okHandler, optsValidateRequest);
      request(app)
        .get('/invalid')
        .expect(404)
        .end(done);
    });

    it('passes through when valid URL invalid method', (done) => {
      const app = createServer(okHandler, optsValidateRequest);
      request(app)
        .put('/')
        .expect(404)
        .end(done);
    });

    it('passes request that is not defined in the schema', (done) => {
      const app = createServer(okHandler, optsValidateRequest, '/route-not-in-schema');
      request(app)
        .get('/route-not-in-schema')
        .expect(200)
        .end(done);
    });
  });

  describe('do not validate', () => {
    it('passes request through when when both validations are set to false', (done) => {
      const app = createServer(okHandler, optsDoNotValidate, '/status');
      request(app)
        .get('/status')
        .expect(200)
        .end(done);
    });

    it('passes request through when no request body needed', (done) => {
      const app = createServer(okHandler, optsValidateAll, '/status');
      request(app)
        .get('/status')
        .expect(200)
        .end(done);
    });
  });
});
