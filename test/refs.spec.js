const { okHandler } = require('middleware-testlab').handlers.express;
const request = require('supertest');
const { describe } = require('mocha');
const { it } = require('mocha');
const { createServer, getOpts } = require('./helpers');

const schema = require('./swagger-schemas/refs.json');

const optsValidateResponse = getOpts(schema, false, true);
const optsValidateRequest = getOpts(schema, true, false);

describe('refs', () => {
  it('validates request with schema via ref', (done) => {
    const app = createServer(okHandler, optsValidateRequest, {
      method: 'post',
      path: '/person'
    });
    request(app)
      .post('/person')
      .set({ name: 'name' })
      .expect(200)
      .end(done);
  });

  it('validates response with schema via ref', (done) => {
    const handler = (req, res) => {
      res.json({
        name: 'name',
      });
    };

    const app = createServer(handler, optsValidateResponse, {
      method: 'post',
      path: '/person'
    });
    request(app)
      .post('/person')
      .set({ name: 'name' })
      .expect(200)
      .end(done);
  });
});
