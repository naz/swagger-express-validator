const { Router } = require('express');
const request = require('supertest');
const { okHandler } = require('middleware-testlab').handlers.express;
const { describe } = require('mocha');
const { it } = require('mocha');
const { createServerLegacy: createServer, createServer: createServerNew, getOpts } = require('./helpers');

const schema = require('./swagger-schemas/pet-store.json');

const optsValidateResponse = getOpts(schema, false, true);
const optsValidateRequest = getOpts(schema, true, false);
const optsValidateAll = getOpts(schema, true, true);

describe('pet store', () => {
  describe('validates basic response', () => {
    it('should process valid request', (done) => {
      const router = Router();
      router.get('/pet/:id', (req, res) => {
        res.json({
          id: 1,
          age: 21,
          name: 'Pet Name',
          photoUrls: ['https://catphoto.com/best-cat'],
        });
      });
      const app = createServer(router, optsValidateResponse);

      request(app)
        .get('/pet/1')
        .expect(200)
        .end(done);
    });

    it('fails with 500 response code due to invalid response object', (done) => {
      const router = Router();
      router.get('/pet/:id', (req, res) => {
        res.json({
          id: 1,
          name: 'Pet Name',
        });
      });
      const app = createServer(router, optsValidateResponse);

      request(app)
        .get('/pet/1')
        .expect(500)
        .expect((res) => {
          if (!res.body.message.includes('Response schema validation failed')) {
            throw new Error(`invalid response body message for: ${JSON.stringify(res.body)}`);
          }
        })
        .end(done);
    });

    it('allows `nullable` filed in response', (done) => {
      const router = Router();
      router.get('/pet/:id', (req, res) => {
        res.json({
          id: 1,
          age: null,
          name: 'Pet Name',
          photoUrls: [],
        });
      });
      const app = createServer(router, optsValidateResponse);

      request(app)
        .get('/pet/1')
        .expect(200)
        .end(done);
    });
  });

  describe('validates basic request', () => {
    it('passes request through when no request body needed', (done) => {
      const router = Router();
      router.get('/pet', (req, res) => {
        res.json({
          status: 'OK',
        });
      });
      const app = createServer(router, optsValidateRequest);
      request(app)
        .get('/pet')
        .expect(200)
        .end(done);
    });

    it('fails request with 400 when does not pass request schema validation', (done) => {
      const app = createServerNew(okHandler, optsValidateRequest, {
        method: 'post',
        path: '/pet'
      });

      request(app)
        .post('/pet')
        .send({
          name: 'hello',
        })
        .expect(400)
        .end(done);
    });

    it('fails request with 400 when does not pass request schema validation - returns errors', (done) => {
      const opts = {
        schema,
        returnRequestErrors: true,
        validateRequest: true,
        validateResponse: false
      };
      const app = createServerNew(okHandler, opts, {
        method: 'post',
        path: '/pet'
      });

      request(app)
        .post('/pet')
        .send({
          name: 'hello',
        })
        .expect(400)
        .expect((res) => {
          const error = res.body.errors[0];
          if (error.message !== 'should have required property \'photoUrls\'') {
            throw new Error(`invalid response body message for: ${JSON.stringify(res.body)}`);
          }
        })
        .end(done);
    });

    it('passes request that is not defined in the schema', (done) => {
      const router = Router();
      router.post('/route-not-in-schema', (req, res) => {
        res.json({
          status: 'OK',
        });
      });
      const app = createServer(router, optsValidateRequest);
      request(app)
        .post('/route-not-in-schema')
        .expect(200)
        .end(done);
    });

    it('passes request that is valid for matching schema', (done) => {
      const router = Router();
      router.post('/pet', (req, res) => {
        res.json({
          status: 'OK',
        });
      });
      const app = createServer(router, optsValidateRequest);
      request(app)
        .post('/pet')
        .send({
          name: 'Petty the Pet',
          photoUrls: ['https://catphoto.com/best-cat'],
        })
        .expect(200)
        .end(done);
    });

    it('checks for basePath in schema when matching URL', (done) => {
      const router = Router();
      router.post('/v2/pet', (req, res) => {
        res.json({
          status: 'OK',
        });
      });
      const app = createServer(router, optsValidateRequest);
      request(app)
        .post('/v2/pet')
        .send({
          name: 'hello',
        })
        .expect(400)
        .end(done);
    });

    it('uses correct body parameter when other parameters exist', (done) => {
      const router = Router();
      router.put('/user/name', (req, res) => {
        res.json({
          status: 'OK',
        });
      });
      const app = createServer(router, optsValidateRequest);
      request(app)
        .put('/user/name')
        .send({
          id: 'not_integer',
        })
        .expect(400)
        .end(done);
    });
  });

  describe('validates requests and responses', () => {
    it('fails request with 400 when doesn\'t pass request schema validation', (done) => {
      const router = Router();
      router.post('/pet', (req, res) => {
        res.json({
          status: 'OK',
        });
      });
      const app = createServer(router, optsValidateAll);
      request(app)
        .post('/pet')
        .send({
          name: 'hello',
        })
        .expect(400)
        .end(done);
    });

    it('passes request that is valid for matching schema', (done) => {
      const router = Router();
      router.post('/pet', (req, res) => {
        res.json({
          status: 'OK',
        });
      });
      const app = createServer(router, optsValidateAll);
      request(app)
        .post('/pet')
        .send({
          name: 'Petty the Pet',
          photoUrls: ['https://catphoto.com/best-cat'],
        })
        .expect(200)
        .end(done);
    });

    it('should process valid response', (done) => {
      const router = Router();
      router.get('/pet/:id', (req, res) => {
        res.json({
          id: 1,
          age: 21,
          name: 'Pet Name',
          photoUrls: ['https://catphoto.com/best-cat'],
        });
      });
      const app = createServer(router, optsValidateAll);

      request(app)
        .get('/pet/1')
        .expect(200)
        .end(done);
    });

    it('fails with 500 response code due to invalid response object', (done) => {
      const router = Router();
      router.get('/pet/:id', (req, res) => {
        res.json({
          // id: 1,
          name: 'Pet Name',
        });
      });
      const app = createServer(router, optsValidateAll);

      request(app)
        .get('/pet/1')
        .expect(500)
        .expect((res) => {
          if (!res.body.message.includes('Response schema validation failed')) {
            throw new Error(`invalid response body message for: ${JSON.stringify(res.body)}`);
          }
        })
        .end(done);
    });

    it('should process valid string response', (done) => {
      const router = Router();
      router.get('/firstname/:username', (req, res) => {
        res.json('firstname1');
      });
      const app = createServer(router, optsValidateAll);

      request(app)
        .get('/firstname/user1')
        .expect(200)
        .end(done);
    });

    it('fails with 500 response code due to invalid response string return', (done) => {
      const router = Router();
      router.get('/firstname/:username', (req, res) => {
        res.json({});
      });
      const app = createServer(router, optsValidateAll);

      request(app)
        .get('/firstname/user1')
        .expect(500)
        .end(done);
    });

    it('should process valid boolean response', (done) => {
      const router = Router();
      router.get('/isValidUser/:username', (req, res) => {
        res.json(false);
      });
      const app = createServer(router, optsValidateAll);

      request(app)
        .get('/isValidUser/user1')
        .expect(200)
        .end(done);
    });
  });

  describe('supports overriding ajv settings', () => {
    const serverOpts = {
      schema,
      validateRequest: true,
      validateResponse: true,
      ajvRequestOptions: {
        coerceTypes: true,
      },
      ajvResponseOptions: {
        coerceTypes: true,
      },
    };

    it('request passes after type coercion is applied', (done) => {
      const router = Router();
      router.post('/pet', (req, res) => {
        res.json({
          status: 'OK',
        });
      });
      const app = createServer(router, serverOpts);
      request(app)
        .post('/pet')
        .send({
          id: '1',
          name: 'Petty the Pet',
          photoUrls: ['https://catphoto.com/best-cat'],
        })
        .expect(200)
        .end(done);
    });

    it('response passes after coercion is applied', (done) => {
      const router = Router();
      router.get('/pet/:id', (req, res) => {
        res.json({
          id: '1',
          age: 21,
          name: 'Pet Name',
          photoUrls: ['https://catphoto.com/best-cat'],
        });
      });
      const app = createServer(router, serverOpts);

      request(app)
        .get('/pet/1')
        .expect(200)
        .end(done);
    });
  });
});
