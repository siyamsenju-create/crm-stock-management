/**
 * Jest Global Setup — runs ONCE before all test suites.
 * Starts an in-memory MongoDB instance so tests are:
 *   - Fast (no network latency)
 *   - Isolated (no shared Atlas data)
 *   - CI-friendly (no external DB required)
 */
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

module.exports = async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: { dbName: 'crm-test' },
  });
  const uri = mongoServer.getUri();

  // Make URI available to all test files via env var
  process.env.MONGO_URI_TEST = uri;
  process.env.MONGO_URI = uri;
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_32chars_minimum_ok';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_32chars_ok!';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.PORT = '5005';

  // Store reference so teardown can stop it
  global.__MONGO_SERVER__ = mongoServer;
};
