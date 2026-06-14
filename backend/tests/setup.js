/**
 * Jest Global Setup — runs ONCE before all test suites.
 */
module.exports = async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_32chars_minimum_ok';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_32chars_ok!';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.PORT = '5005';
};
