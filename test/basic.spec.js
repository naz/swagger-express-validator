const Router = require('express').Router;
const request = require('supertest');
const describe = require('mocha/lib/mocha.js').describe;
const it = require('mocha/lib/mocha.js').it;
const { createServer } = require('./helpers');

const schema = require('./swagger-schemas/basic.json');

describe('validates basic response', () => {
  it('passes response through', (done) => {
    const router = Router();
    router.get('/status', (req, res) => {
      res.json({
        status: 'OK',
      });
    });
    const app = createServer(router, { schema });
    request(app)
      .get('/status')
      .expect(200)
      .end((err) => {
        if (err) throw err;
        app.close();
        done();
      });
  });

  it('passes response that is not defined in the schema', (done) => {
    const router = Router();
    router.get('/route-not-in-schema', (req, res) => {
      res.json({
        status: 'OK',
      });
    });
    const app = createServer(router, { schema });
    request(app)
      .get('/route-not-in-schema')
      .expect(200)
      .end((err) => {
        if (err) throw err;
        app.close();
        done();
      });
  });

  it('fails with 500 response code due to invalid response object', (done) => {
    const router = Router();
    router.get('/status', (req, res) => {
      res.json({
        invalid: 'field',
      });
    });
    const app = createServer(router, { schema });
    request(app)
      .get('/status')
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

describe('validates basic request', () => {
  it('passes request through', (done) => {
    const router = Router();
    router.get('/status', (req, res) => {
      res.json({
        status: 'OK',
      });
    });
    const app = createServer(router, { schema });
    request(app)
      .get('/status')
      .expect(200)
      .end((err) => {
        if (err) throw err;
        app.close();
        done();
      });
  });

  it('passes response that is not defined in the schema', (done) => {
    const router = Router();
    router.get('/route-not-in-schema', (req, res) => {
      res.json({
        status: 'OK',
      });
    });
    const app = createServer(router, { schema });
    request(app)
      .get('/route-not-in-schema')
      .expect(200)
      .end((err) => {
        if (err) throw err;
        app.close();
        done();
      });
  });

  it('fails with 500 response code due to invalid response object', (done) => {
    const router = Router();
    router.get('/status', (req, res) => {
      res.json({
        invalid: 'field',
      });
    });
    const app = createServer(router, { schema });
    request(app)
      .get('/status')
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
