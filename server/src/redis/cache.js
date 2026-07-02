const redisClient = require('../config/redisClient');
const logger = require('../config/logger');

/**
 * Why a separate cache.js wrapper instead of calling redisClient.get/set directly
 * everywhere in services:
 * - Centralizes JSON.stringify/parse (every cached value here is an object)
 * - Centralizes error handling: if Redis is down, cache failures should NEVER crash
 *   the request — they should just fall through to the DB. A cache is an
 *   optimization, not a dependency the app should die without.
 * - Makes key-naming conventions consistent (see buildKey below)
 */

const DEFAULT_TTL_SEC = 300; // 5 minutes

const get = async (key) => {
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    logger.error(`Cache GET failed for key=${key}: ${err.message}`);
    return null; // fail open — treat as cache miss, let caller hit DB
  }
};

const set = async (key, value, ttlSec = DEFAULT_TTL_SEC) => {
  try {
    await redisClient.set(key, JSON.stringify(value), 'EX', ttlSec);
  } catch (err) {
    logger.error(`Cache SET failed for key=${key}: ${err.message}`);
    // swallow error — caching is best-effort
  }
};

const del = async (key) => {
  try {
    await redisClient.del(key);
  } catch (err) {
    logger.error(`Cache DEL failed for key=${key}: ${err.message}`);
  }
};

// Delete all keys matching a pattern, e.g. "flights:search:*"
// Used for cache invalidation when underlying data changes (admin edits a flight).
const delByPattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length) await redisClient.del(...keys);
  } catch (err) {
    logger.error(`Cache DEL pattern failed for pattern=${pattern}: ${err.message}`);
  }
};

/**
 * Consistent key naming: "domain:subdomain:identifier"
 * e.g. buildKey('flights', 'search', 'DEL-BOM-2026-07-01') -> "flights:search:DEL-BOM-2026-07-01"
 * This convention is what makes delByPattern('flights:search:*') safe and predictable.
 */
const buildKey = (...parts) => parts.join(':');

module.exports = { get, set, del, delByPattern, buildKey };
