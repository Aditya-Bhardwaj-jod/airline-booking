/**
 * Rate limiter unit test — tests the algorithm directly, not via HTTP.
 * Why: we can control timing precisely and test edge cases without
 * worrying about network latency or Express middleware stack.
 *
 * IMPORTANT: requires a running Redis instance on localhost:6379.
 * In CI, add a Redis service container.
 */

// Load env before anything else
process.env.MONGO_URI = 'mongodb://localhost:27017/airline_booking_test';

const { checkRateLimit } = require('../redis/rateLimiter');
const redisClient = require('../config/redisClient');

const IDENTIFIER = `test:ratelimit:${Date.now()}`;
const LIMIT = 5;
const WINDOW_SEC = 2;

afterAll(async () => {
  await redisClient.del(`rate:limit:${IDENTIFIER}`);
  await redisClient.quit();
});

describe('Sliding Window Rate Limiter', () => {
  it('should allow requests under the limit', async () => {
    for (let i = 0; i < LIMIT; i++) {
      const result = await checkRateLimit(IDENTIFIER, LIMIT, WINDOW_SEC);
      expect(result.allowed).toBe(true);
    }
  });

  it('should block the (limit+1)th request', async () => {
    const result = await checkRateLimit(IDENTIFIER, LIMIT, WINDOW_SEC);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should allow requests again after window expires', async () => {
    // Wait for window to slide
    await new Promise((r) => setTimeout(r, WINDOW_SEC * 1000 + 100));
    const result = await checkRateLimit(IDENTIFIER, LIMIT, WINDOW_SEC);
    expect(result.allowed).toBe(true);
  });
});
