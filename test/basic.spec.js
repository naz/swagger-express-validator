const Router = require('express').Router;
const request = require('supertest');
const describe = require('mocha/lib/mocha.js').describe;
const it = require('mocha/lib/mocha.js').it;
const { createServer } = require('./helpers');

const schema = require('./swagger-schemas/basic.json');

describe('basic', () => {
  describe('validates basic response', () => {
    it('passes successful response through', (done) => {
      const router = Router();
      router.get('/status', (req, res) => {
        res.json({
          status: 'OK',
        });
      });
      const app = createServer(router, {
        schema,
        validateRequest: false,
        validateResponse: true,
      });
      request(app)
        .get('/status')
        .expect(200)
        .end((err) => {
          if (err) throw err;
          app.close();
          done();
        });
    });

    it('passes request for invalid URL through', (done) => {
      const router = Router();
      router.get('/status', (req, res) => {
        res.json({
          status: 'OK',
        });
      });
      const app = createServer(router, {
        schema,
        validateRequest: false,
        validateResponse: true,
      });
      request(app)
        .get('/invalid')
        .expect(404)
        .end((err) => {
          if (err) throw err;
          app.close();
          done();
        });
    });

    it('passes request for invalid URL through', (done) => {
      const router = Router();
      router.get('/status', (req, res) => {
        res.json({
          status: 'OK',
        });
      });
      const app = createServer(router, {
        schema,
        validateRequest: false,
        validateResponse: true,
      });
      request(app)
        .put('/status')
        .expect(404)
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
      const app = createServer(router, {
        schema,
        validateRequest: false,
        validateResponse: true,
      });
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
      const app = createServer(router, {
        schema,
        validateRequest: false,
        validateResponse: true,
      });
      request(app)
        .get('/status')
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
      router.get('/status', (req, res) => {
        res.json({
          status: 'OK',
        });
      });
      const app = createServer(router, serverOpts);
      request(app)
        .get('/status')
        .expect(200)
        .end((err) => {
          if (err) throw err;
          app.close();
          done();
        });
    });

    it('passes through when invalid URL', (done) => {
      const router = Router();
      router.get('/status', (req, res) => {
        res.json({
          status: 'OK',
        });
      });
      const app = createServer(router, serverOpts);
      request(app)
        .get('/invalid')
        .expect(404)
        .end((err) => {
          if (err) throw err;
          app.close();
          done();
        });
    });

    it('passes through when valid URL invalid method', (done) => {
      const router = Router();
      router.get('/status', (req, res) => {
        res.json({
          status: 'OK',
        });
      });
      const app = createServer(router, serverOpts);
      request(app)
        .put('/status')
        .expect(404)
        .end((err) => {
          if (err) throw err;
          app.close();
          done();
        });
    });

    it('passes request that is not defined in the schema', (done) => {
      const router = Router();
      router.get('/route-not-in-schema', (req, res) => {
        res.json({
          status: 'OK',
        });
      });
      const app = createServer(router, serverOpts);
      request(app)
        .get('/route-not-in-schema')
        .expect(200)
        .end((err) => {
          if (err) throw err;
          app.close();
          done();
        });
    });
  });

  describe('do not validate', () => {
    it('passes request through when when both validations are set to false', (done) => {
      const serverOpts = {
        schema,
        validateRequest: false,
        validateResponse: false,
      };
      const router = Router();
      router.get('/status', (req, res) => {
        res.json({
          status: 'OK',
        });
      });
      const app = createServer(router, serverOpts);
      request(app)
        .get('/status')
        .expect(200)
        .end((err) => {
          if (err) throw err;
          app.close();
          done();
        });
    });

    it('passes request through when no request body needed', (done) => {
      const serverOpts = {
        validateRequest: true,
        validateResponse: true,
      };
      const router = Router();
      router.get('/status', (req, res) => {
        res.json({
          status: 'OK',
        });
      });
      const app = createServer(router, serverOpts);
      request(app)
        .get('/status')
        .expect(200)
        .end((err) => {
          if (err) throw err;
          app.close();
          done();
        });
    });
  });
});
