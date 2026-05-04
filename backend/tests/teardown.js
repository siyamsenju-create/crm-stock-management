/**
 * Jest Global Teardown — runs ONCE after all test suites.
 * Stops the in-memory MongoDB server.
 */
module.exports = async () => {
  if (global.__MONGO_SERVER__) {
    await global.__MONGO_SERVER__.stop();
  }
};
