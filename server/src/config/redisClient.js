const Redis = require('ioredis');
const env = require('./env');
const logger = require('./logger');

const redisClient = env.redis.url ?
    new Redis(env.redis.url, { tls: { rejectUnauthorized: false } }) :
    new Redis({ host: env.redis.host, port: env.redis.port });

redisClient.on('connect', () => logger.info('Redis connected'));
redisClient.on('error', (err) => logger.error(`Redis error: ${err.message}`));

module.exports = redisClient;