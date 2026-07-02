const Redis = require('ioredis');
const env = require('./env');
const logger = require('./logger');

/**
 * Why ioredis over node-redis:
 * - Native support for Sorted Sets pipelines (we need this for Sliding Window Rate Limiter)
 * - Cleaner Promise-based API, built-in retry strategy
 *
 * Single shared client: Redis connections are relatively expensive (TCP handshake),
 * so we create ONE client and reuse it everywhere (cache, rate limiter, seat lock)
 * rather than opening a new connection per request.
 */
const redisClient = new Redis({
  host: env.redis.host,
  port: env.redis.port,
  maxRetriesPerRequest: 3,
});

redisClient.on('connect', () => logger.info('Redis connected'));
redisClient.on('error', (err) => logger.error(`Redis error: ${err.message}`));

module.exports = redisClient;
