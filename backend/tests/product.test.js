const request = require('supertest');
const app = require('../src/app');
const crypto = require('crypto');
const makeFakeId = () => crypto.randomUUID();
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Transaction = require('../src/models/Transaction');

// ── Test helpers ──────────────────────────────────────────────────────────────

const getToken = async (role = 'Admin') => {
  const email = `test.${role.toLowerCase()}.${Date.now()}@prod.com`;
  await User.create({ name: `T ${role}`, email, password: 'password123', role });
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'password123' });
  return res.body.data.accessToken;
};

const makeProduct = (overrides = {}) => ({
  name: `[TEST] Product ${Date.now()}`,
  price: 999.99,
  quantity: 100,
  category: 'TestCategory',
  ...overrides,
});

// setup/teardown bypassed for local memory DB

afterEach(async () => {
  await User.deleteMany({ email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ });
  await Product.deleteMany({ name: /^\[TEST\]/ });
  await Transaction.deleteMany({ reference: /^Test/ });
});

// ── Product CRUD ──────────────────────────────────────────────────────────────

describe('📦 Products — POST /api/v1/products', () => {
  it('201 — Admin creates a product', async () => {
    const token = await getToken('Admin');
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send(makeProduct({ quantity: 50 }));

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data.quantity).toBe(50);
  });

  it('403 — User role cannot create a product', async () => {
    const token = await getToken('User');
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send(makeProduct());
    expect(res.statusCode).toBe(403);
  });

  it('401 — Unauthenticated request rejected', async () => {
    const res = await request(app).post('/api/v1/products').send(makeProduct());
    expect(res.statusCode).toBe(401);
  });

  it('422 — Rejects missing required fields', async () => {
    const token = await getToken('Admin');
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '[TEST] Incomplete' });
    expect(res.statusCode).toBe(422);
    expect(res.body.details).toBeDefined();
  });

  it('422 — Rejects negative price', async () => {
    const token = await getToken('Admin');
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send(makeProduct({ price: -50 }));
    expect(res.statusCode).toBe(422);
  });
});

describe('📦 Products — GET /api/v1/products', () => {
  it('200 — Returns paginated product list', async () => {
    const token = await getToken('User');
    const res = await request(app)
      .get('/api/v1/products?page=1&limit=5')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.meta).toHaveProperty('page', 1);
    expect(res.body.meta).toHaveProperty('limit', 5);
  });

  it('200 — Search by name works', async () => {
    const token = await getToken('Admin');
    await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send(makeProduct({ name: '[TEST] SearchMe Unique' }));

    const res = await request(app)
      .get('/api/v1/products?search=SearchMe')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.some((p) => p.name.includes('SearchMe'))).toBe(true);
  });
});

describe('📦 Products — GET /api/v1/products/:id', () => {
  it('200 — Returns correct product', async () => {
    const token = await getToken('Admin');
    const createRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send(makeProduct());

    const id = createRes.body.data._id;
    const res = await request(app)
      .get(`/api/v1/products/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data._id).toBe(id);
  });

  it('404 — Returns 404 for non-existent product', async () => {
    const token = await getToken('User');
    const fakeId = makeFakeId();
    const res = await request(app)
      .get(`/api/v1/products/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });

  it('400 — Invalid ObjectId returns error', async () => {
    const token = await getToken('User');
    const res = await request(app)
      .get('/api/v1/products/invalid-id-with-special-chars!!!')
      .set('Authorization', `Bearer ${token}`);
    // Joi validation catches this as 422
    expect([400, 422].includes(res.statusCode)).toBe(true);
  });
});

describe('📦 Products — PUT /api/v1/products/:id', () => {
  it('200 — Admin updates product name and price', async () => {
    const token = await getToken('Admin');
    const createRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send(makeProduct());

    const id = createRes.body.data._id;
    const res = await request(app)
      .put(`/api/v1/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '[TEST] Updated Name', price: 500 });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('[TEST] Updated Name');
    expect(res.body.data.price).toBe(500);
  });

  it('200 — Quantity field in update body is silently ignored', async () => {
    const token = await getToken('Admin');
    const createRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send(makeProduct({ quantity: 100 }));

    const id = createRes.body.data._id;
    // Update with quantity — should be stripped by Joi schema
    const res = await request(app)
      .put(`/api/v1/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '[TEST] QuantityIgnore', quantity: 9999 });

    expect(res.statusCode).toBe(200);
    // Quantity must remain 100 (unchanged)
    expect(res.body.data.quantity).toBe(100);
  });
});

describe('📦 Products — DELETE /api/v1/products/:id', () => {
  it('200 — Admin deletes a product', async () => {
    const token = await getToken('Admin');
    const createRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send(makeProduct());

    const id = createRes.body.data._id;
    const res = await request(app)
      .delete(`/api/v1/products/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);

    // Confirm it's gone
    const getRes = await request(app)
      .get(`/api/v1/products/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.statusCode).toBe(404);
  });

  it('403 — User role cannot delete a product', async () => {
    const adminToken = await getToken('Admin');
    const userToken = await getToken('User');
    const createRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(makeProduct());

    const res = await request(app)
      .delete(`/api/v1/products/${createRes.body.data._id}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(403);
  });
});
