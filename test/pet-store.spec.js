const Router = require('express').Router;
const request = require('supertest');
const describe = require('mocha/lib/mocha.js').describe;
const it = require('mocha/lib/mocha.js').it;
const { createServer } = require('./helpers');

const schema = require('./swagger-schemas/pet-store.json');

describe('validates basic response', () => {
  it('should process valid request', (done) => {
    const router = Router();
    router.get('/pet/:id', (req, res) => {
      res.json({
        id: 1,
        name: 'Pet Name',
        photoUrls: ['https://catphoto.com/best-cat'],
      });
    });
    const app = createServer(router, { schema });

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
    const app = createServer(router, { schema });

    request(app)
      .get('/pet/1')
      .expect(500)
      .expect((res) => {
        if (!res.body.message.includes('response schema validation failed')) {
          throw new Error('invalid response body message');
        }
      })
      .end((err) => {
        if (err) throw err;
        app.close();
        done();
      });
  });
});
