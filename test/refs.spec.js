const Router = require('express').Router;
const request = require('supertest');
const describe = require('mocha/lib/mocha.js').describe;
const it = require('mocha/lib/mocha.js').it;
const { createServer } = require('./helpers');

const schema = require('./swagger-schemas/refs.json');

describe('refs', () => {
  it('validates request with schema via ref', (done) => {
    const router = Router();
    router.post('/person', (req, res) => {
      res.json({
        status: 'OK',
      });
    });
    const app = createServer(router, {
      schema,
      validateRequest: true,
      validateResponse: false,
    });
    request(app)
      .post('/person')
      .set({ name: 'name' })
      .expect(200)
      .end((err) => {
        if (err) throw err;
        app.close();
        done();
      });
  });

  it('validates response with schema via ref', (done) => {
    const router = Router();
    router.post('/person', (req, res) => {
      res.json({
        name: 'name',
      });
    });
    const app = createServer(router, {
      schema,
      validateRequest: false,
      validateResponse: true,
    });
    request(app)
      .post('/person')
      .set({ name: 'name' })
      .expect(200)
      .end((err) => {
        if (err) throw err;
        app.close();
        done();
      });
  });
});
