const Router = require('express').Router;
const request = require('supertest');
const describe = require('mocha/lib/mocha.js').describe;
const it = require('mocha/lib/mocha.js').it;
const { createServer } = require('./helpers');

const schema = require('./swagger-schemas/pet-store.json');

describe('pet store', () => {
  describe('validates basic response', () => {
    const serverOpts = {
      schema,
      validateRequest: false,
      validateResponse: true,
    };

    it('should process valid request', (done) => {
      const router = Router();
      router.get('/pet/:id', (req, res) => {
        res.json({
          id: 1,
          name: 'Pet Name',
          photoUrls: ['https://catphoto.com/best-cat'],
        });
      });
      const app = createServer(router, serverOpts);

      request(app)
        .get('/pet/1')
        .expect(200)
        .end((err) => {
          if (err) throw err;
          app.close();
          done();
        });
    });

    it('fails with 500 response code due to invalid response object', (done) => {
      const router = Router();
      router.get('/pet/:id', (req, res) => {
        res.json({
          id: 1,
          name: 'Pet Name',
        });
      });
      const app = createServer(router, serverOpts);

      request(app)
        .get('/pet/1')
        .expect(500)
        .expect((res) => {
          if (!res.body.message.includes('Response schema validation failed')) {
            throw new Error(`invalid response body message for: ${JSON.stringify(res.body)}`);
          }
        })
        .end((err) => {
          if (err) throw err;
          app.close();
          done();
        });
    });
  });

  describe('validates basic request', () => {
    const serverOpts = {
      schema,
      validateRequest: true,
      validateResponse: false,
    };

    it('passes request through when no request body needed', (done) => {
      const router = Router();
      router.get('/pet', (req, res) => {
        res.json({
          status: 'OK',
        });
      });
      const app = createServer(router, serverOpts);
      request(app)
        .get('/pet')
        .expect(200)
        .end((err) => {
          if (err) throw err;
          app.close();
          done();
        });
    });

    it('fails request with 400 when doesn\'t pass request schema validation', (done) => {
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
          name: 'hello',
        })
        .expect(400)
        .end((err) => {
          if (err) throw err;
          app.close();
          done();
        });
    });

    it('passes request that is not defined in the schema', (done) => {
      const router = Router();
      router.post('/route-not-in-schema', (req, res) => {
        res.json({
          status: 'OK',
        });
      });
      const app = createServer(router, serverOpts);
      request(app)
        .post('/route-not-in-schema')
        .expect(200)
        .end((err) => {
          if (err) throw err;
          app.close();
          done();
        });
    });
  });
});
