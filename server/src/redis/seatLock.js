const redisClient = require('../config/redisClient');
const env = require('../config/env');

/**
 * SEAT LOCK — Redis TTL-based temporary reservation
 *
 * Flow:
 *   User selects seat 12A on flight F123
 *     → acquireLock('F123', '12A', 'userId') sets key with 5min TTL
 *     → Other users see "Temporarily Reserved" (key exists in Redis)
 *     → If user completes booking → DB isBooked=true, lock released
 *     → If user abandons → TTL expires, lock auto-released by Redis
 *
 * Key: `seat:lock:{flightId}:{seatNumber}`
 * Value: userId (so we can verify only the lock holder can book/release it)
 *
 * WHY REDIS NX FLAG:
 * SET key value EX 300 NX  → set ONLY if key does NOT exist (atomic).
 * Without NX, two users could simultaneously check "is this seat free?" both
 * see "yes", both set the key — race condition, double booking.
 * NX makes the check-and-set atomic at the Redis level.
 */

const LOCK_KEY = (flightId, seatNumber) => `seat:lock:${flightId}:${seatNumber}`;

/**
 * Try to acquire a seat lock.
 * Returns true if lock acquired, false if seat already locked by someone else.
 */
const acquireLock = async (flightId, seatNumber, userId) => {
  const key = LOCK_KEY(flightId, seatNumber);
  // SET key userId EX ttl NX → returns 'OK' if set, null if key already exists
  const result = await redisClient.set(key, userId, 'EX', env.seatLock.ttlSec, 'NX');
  return result === 'OK';
};

/**
 * Release a seat lock — only the lock owner (same userId) can release it.
 * Uses a Lua script to make the check-and-delete atomic.
 * Without atomicity: thread A reads key=userId (matches), thread B deletes key,
 * thread C sets a new lock, thread A deletes thread C's lock. Chaos.
 */
const releaseLock = async (flightId, seatNumber, userId) => {
  const key = LOCK_KEY(flightId, seatNumber);
  const lua = `
    if redis.call('GET', KEYS[1]) == ARGV[1] then
      return redis.call('DEL', KEYS[1])
    else
      return 0
    end
  `;
  await redisClient.eval(lua, 1, key, userId);
};

/**
 * Verify the requesting user actually holds the lock on this seat.
 * Called during booking confirmation — prevents user B from booking
 * a seat locked by user A even if they somehow know the seatNumber.
 */
const verifyLock = async (flightId, seatNumber, userId) => {
  const key = LOCK_KEY(flightId, seatNumber);
  const lockOwner = await redisClient.get(key);
  return lockOwner === userId;
};

const getLockTTL = async (flightId, seatNumber) => {
  return redisClient.ttl(LOCK_KEY(flightId, seatNumber)); // seconds remaining
};

module.exports = { acquireLock, releaseLock, verifyLock, getLockTTL };
