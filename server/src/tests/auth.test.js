const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

/**
 * Why we import app (not server):
 * app.js has no listen() or DB connect — supertest handles the port internally.
 * server.js starts real connections — we don't want that in tests.
 */

const TEST_USER = {
  name: 'Test User',
  email: `test_${Date.now()}@example.com`, // unique per run
  password: 'password123',
};

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/airline_booking_test');
});

afterAll(async () => {
  // Cleanup test user
  await mongoose.connection.collection('users').deleteMany({ email: TEST_USER.email });
  await mongoose.connection.close();
});

describe('POST /api/auth/signup', () => {
  it('should create a new user and return token', async () => {
    const res = await request(app).post('/api/auth/signup').send(TEST_USER);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(TEST_USER.email);
    expect(res.body.data.token).toBeDefined();
    // Password must NOT be in response
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('should return 409 if email already registered', async () => {
    const res = await request(app).post('/api/auth/signup').send(TEST_USER);
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'X', email: 'not-an-email', password: '123456' });
    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeDefined();
    // httpOnly cookie must be set
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should return 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
    // Same message regardless of wrong email or wrong password (prevents user enumeration)
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('should return 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'doesntmatter' });
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });
});
