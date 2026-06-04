const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const { verifyFirebaseIdToken } = require('../src/utils/firebaseAuth');

jest.mock('../src/utils/firebaseAuth', () => ({
  verifyFirebaseIdToken: jest.fn(),
}));

// ── Test helpers ──────────────────────────────────────────────────────────────

/**
 * Create a test user in DB and return a valid JWT token.
 */
const createUserAndLogin = async (role = 'Admin') => {
  const email = `test.${role.toLowerCase()}.${Date.now()}@test.com`;
  const user = await User.create({
    name: `Test ${role}`,
    email,
    password: 'password123',
    role,
  });

  const loginRes = await request(app).post('/api/v1/auth/login').send({
    email,
    password: 'password123',
  });

  return { user, token: loginRes.body.data.accessToken };
};

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  const uri = process.env.MONGO_URI_TEST || process.env.MONGO_URI;
  if (!mongoose.connection.readyState) {
    await mongoose.connect(uri);
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});

afterEach(async () => {
  // Clean up created test records after each test
  await User.deleteMany({ email: /^test\./ });
  await Product.deleteMany({ name: /^\[TEST\]/ });
});

// ── Auth Tests ────────────────────────────────────────────────────────────────

describe('🔐 Auth — POST /api/v1/auth/register', () => {
  it('201 — registers a new user and returns tokens', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test User',
      email: `test.user.reg.${Date.now()}@test.com`,
      password: 'password123',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data).toHaveProperty('role', 'User');
  });

  it('409 — rejects duplicate email', async () => {
    const email = `test.dup.${Date.now()}@test.com`;
    await User.create({ name: 'Dup', email, password: 'password123' });
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Dup2',
      email,
      password: 'password123',
    });
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('422 — rejects invalid email format', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test',
      email: 'not-an-email',
      password: 'password123',
    });
    expect(res.statusCode).toBe(422);
    expect(res.body.details).toBeDefined();
  });

  it('422 — rejects password shorter than 6 chars', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test',
      email: `test.short.${Date.now()}@test.com`,
      password: '123',
    });
    expect(res.statusCode).toBe(422);
  });
});

describe('🔐 Auth — POST /api/v1/auth/login', () => {
  it('200 — logs in with valid credentials', async () => {
    const email = `test.login.${Date.now()}@test.com`;
    await User.create({ name: 'Login Test', email, password: 'password123' });

    const res = await request(app).post('/api/v1/auth/login').send({
      email,
      password: 'password123',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
  });

  it('401 — rejects wrong password', async () => {
    const email = `test.wrongpw.${Date.now()}@test.com`;
    await User.create({ name: 'WrongPW', email, password: 'correctpass' });
    const res = await request(app).post('/api/v1/auth/login').send({
      email,
      password: 'wrongpass',
    });
    expect(res.statusCode).toBe(401);
  });

  it('422 — rejects missing fields', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'a@b.com' });
    expect(res.statusCode).toBe(422);
  });
});

describe('🔐 Auth — GET /api/v1/auth/me', () => {
  it('200 — returns profile when authenticated', async () => {
    const { token, user } = await createUserAndLogin('User');
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe(user.email);
  });

  it('401 — rejects missing token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('401 — rejects malformed token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer not.a.valid.token');
    expect(res.statusCode).toBe(401);
  });
});

describe('🔐 Auth — POST /api/v1/auth/google', () => {
  it('200 — registers and logs in a new user with valid Firebase ID token', async () => {
    const email = `test.google.new.${Date.now()}@test.com`;
    verifyFirebaseIdToken.mockResolvedValue({
      email,
      name: 'Google New User',
    });

    const res = await request(app).post('/api/v1/auth/google').send({
      idToken: 'mock_valid_token_new',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.email).toBe(email);

    // Verify user was actually created in MongoDB
    const userInDb = await User.findOne({ email });
    expect(userInDb).toBeDefined();
    expect(userInDb.name).toBe('Google New User');
  });

  it('200 — logs in an existing user with valid Firebase ID token', async () => {
    const email = `test.google.exist.${Date.now()}@test.com`;
    await User.create({
      name: 'Existing Google User',
      email,
      password: 'some-random-password',
      role: 'User',
    });

    verifyFirebaseIdToken.mockResolvedValue({
      email,
      name: 'Existing Google User',
    });

    const res = await request(app).post('/api/v1/auth/google').send({
      idToken: 'mock_valid_token_existing',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(email);
  });

  it('401 — rejects invalid Firebase ID token', async () => {
    const error = new Error('Invalid token signature');
    error.statusCode = 401;
    verifyFirebaseIdToken.mockRejectedValue(error);

    const res = await request(app).post('/api/v1/auth/google').send({
      idToken: 'mock_invalid_token',
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('422 — rejects missing idToken', async () => {
    const res = await request(app).post('/api/v1/auth/google').send({});
    expect(res.statusCode).toBe(422);
  });
});
