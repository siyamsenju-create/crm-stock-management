const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');

// Mock mongoose connect and disconnect
beforeAll(async () => {
  // In a real scenario, you'd connect to a test database
  // await mongoose.connect(process.env.MONGO_URI_TEST);
});

afterAll(async () => {
  // await mongoose.connection.close();
});

describe('Product API Integration Tests', () => {
  it('should return 401 if accessing protected route without token', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });

  it('should hit base endpoint correctly', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('API is running successfully');
  });
});
