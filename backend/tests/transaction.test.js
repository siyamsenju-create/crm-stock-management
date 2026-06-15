const request = require('supertest');
const app = require('../src/app');
const crypto = require('crypto');
const makeFakeId = () => crypto.randomUUID();
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Transaction = require('../src/models/Transaction');

// ── Test helpers ──────────────────────────────────────────────────────────────

const getToken = async (role = 'Admin') => {
  const email = `test.${role.toLowerCase()}.tx.${Date.now()}@test.com`;
  await User.create({ name: `T ${role}`, email, password: 'password123', role });
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'password123' });
  return res.body.data.accessToken;
};

const createProduct = async (token, quantity = 100) => {
  const res = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: `[TEST] TX Product ${Date.now()}`,
      price: 100,
      quantity,
      category: 'TestCategory',
    });
  return res.body.data;
};

// setup/teardown bypassed for local memory DB

afterEach(async () => {
  await User.deleteMany({ email: /^test\./ });
  await Product.deleteMany({ name: /^\[TEST\]/ });
  await Transaction.deleteMany({});
});

// ── Transaction Tests ─────────────────────────────────────────────────────────

describe('🔄 Transactions — POST /api/v1/transactions', () => {
  it('201 — records an IN transaction and increases stock', async () => {
    const token = await getToken('Admin');
    const product = await createProduct(token, 0);

    const res = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, type: 'IN', quantity: 50, reference: 'Test restock' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.type).toBe('IN');
    expect(res.body.data.quantity).toBe(50);

    // Verify product quantity updated
    const productRes = await request(app)
      .get(`/api/v1/products/${product._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(productRes.body.data.quantity).toBe(50);
  });

  it('201 — records an OUT transaction and decreases stock', async () => {
    const token = await getToken('Admin');
    const product = await createProduct(token, 100);

    const res = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, type: 'OUT', quantity: 30 });

    expect(res.statusCode).toBe(201);

    const productRes = await request(app)
      .get(`/api/v1/products/${product._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(productRes.body.data.quantity).toBe(70);
  });

  it('400 — prevents OUT transaction when stock is insufficient', async () => {
    const token = await getToken('Admin');
    const product = await createProduct(token, 10);

    const res = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, type: 'OUT', quantity: 50 });

    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe('INSUFFICIENT_STOCK');

    // Stock unchanged
    const productRes = await request(app)
      .get(`/api/v1/products/${product._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(productRes.body.data.quantity).toBe(10);
  });

  it('404 — rejects transaction for non-existent product', async () => {
    const token = await getToken('Admin');
    const fakeId = makeFakeId();
    const res = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: fakeId.toString(), type: 'IN', quantity: 10 });
    expect(res.statusCode).toBe(404);
  });

  it('422 — rejects invalid transaction type', async () => {
    const token = await getToken('Admin');
    const product = await createProduct(token, 100);

    const res = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, type: 'INVALID', quantity: 10 });
    expect(res.statusCode).toBe(422);
  });

  it('422 — rejects quantity of 0', async () => {
    const token = await getToken('Admin');
    const product = await createProduct(token, 100);

    const res = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, type: 'IN', quantity: 0 });
    expect(res.statusCode).toBe(422);
  });

  it('401 — rejects unauthenticated request', async () => {
    const res = await request(app).post('/api/v1/transactions').send({
      productId: makeFakeId(),
      type: 'IN',
      quantity: 10,
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('🔄 Transactions — GET /api/v1/transactions', () => {
  it('200 — returns paginated transactions', async () => {
    const token = await getToken('Admin');
    const res = await request(app)
      .get('/api/v1/transactions?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.meta).toHaveProperty('page', 1);
  });

  it('200 — filters by transaction type', async () => {
    const token = await getToken('Admin');
    const product = await createProduct(token, 100);

    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, type: 'OUT', quantity: 10 });

    const res = await request(app)
      .get('/api/v1/transactions?type=OUT')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.every((t) => t.type === 'OUT')).toBe(true);
  });
});
