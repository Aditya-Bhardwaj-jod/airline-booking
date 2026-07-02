const redisClient = require('../config/redisClient');

/**
 * ============================================================
 * SLIDING WINDOW RATE LIMITER — built from scratch on Redis Sorted Sets
 * ============================================================
 *
 * WHY SLIDING WINDOW > FIXED WINDOW:
 *
 * Fixed Window: counter resets at fixed clock boundaries (e.g. every minute
 * at :00). PROBLEM: a user can send `limit` requests at 0:59 and another
 * `limit` requests at 1:00 — that's 2x the limit in a 2-second span, because
 * the "window" boundary is artificial, not relative to the user's actual
 * request pattern. This is a well-known flaw exploited as a burst attack.
 *
 * Sliding Window: instead of resetting at fixed clock ticks, we look at a
 * MOVING window of "the last N seconds from right now" for every single
 * request. There's no reset point to exploit — the window slides continuously
 * with time. This gives accurate, gameable-resistant rate limiting.
 *
 * HOW WE IMPLEMENT IT WITH REDIS SORTED SETS:
 *
 * For each identifier (userId or IP), we maintain a Sorted Set where:
 *   - member = a unique string for this request (timestamp + random suffix,
 *     since two requests CAN arrive in the same millisecond)
 *   - score  = the request's timestamp in milliseconds
 *
 * On every incoming request we do FOUR things atomically (via a Lua script):
 *   1. ZREMRANGEBYSCORE — remove all entries with score < (now - windowMs).
 *      This "slides" the window forward by dropping requests that have
 *      aged out.
 *   2. ZCARD — count how many requests remain in the set (i.e. how many
 *      requests happened in the last windowMs).
 *   3. If count < limit: ZADD the current request (score=now), allow it.
 *      If count >= limit: reject, don't add.
 *   4. EXPIRE the key to windowSec so Redis auto-cleans abandoned keys
 *      (users who stop making requests) — this is just memory hygiene,
 *      not part of the rate-limit logic itself.
 *
 * WHY A LUA SCRIPT INSTEAD OF SEPARATE COMMANDS:
 * If we ran ZREMRANGEBYSCORE, ZCARD, and ZADD as separate round-trips,
 * two concurrent requests from the SAME user could both read "count = 19"
 * (just under a limit of 20) before either one writes — both would be
 * allowed, letting the user slip through with 21 requests. Redis executes
 * Lua scripts atomically (single-threaded, no other client's commands can
 * interleave), which closes this race condition completely.
 */

const luaScript = `
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local windowMs = tonumber(ARGV[2])
  local limit = tonumber(ARGV[3])
  local member = ARGV[4]
  local windowSec = tonumber(ARGV[5])

  -- 1. Slide the window: drop requests older than (now - windowMs)
  redis.call('ZREMRANGEBYSCORE', key, '-inf', now - windowMs)

  -- 2. Count requests currently in the window
  local count = redis.call('ZCARD', key)

  if count < limit then
    -- 3. Allow: record this request
    redis.call('ZADD', key, now, member)
    redis.call('EXPIRE', key, windowSec)
    return {1, limit - count - 1}  -- {allowed=1, remaining}
  else
    -- 3. Reject: do not add
    redis.call('EXPIRE', key, windowSec)
    return {0, 0}  -- {allowed=0, remaining=0}
  end
`;

let scriptSha = null;

const loadScript = async () => {
  scriptSha = await redisClient.script('LOAD', luaScript);
  return scriptSha;
};

/**
 * @param {string} identifier - unique key for the requester (userId or IP)
 * @param {number} limit - max requests allowed within the window
 * @param {number} windowSec - window size in seconds
 * @returns {Promise<{ allowed: boolean, remaining: number }>}
 */
const checkRateLimit = async (identifier, limit, windowSec) => {
  const key = `rate:limit:${identifier}`;
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const member = `${now}-${Math.random().toString(36).slice(2, 8)}`; // unique even within same ms

  if (!scriptSha) await loadScript();

  let result;
  try {
    result = await redisClient.evalsha(
      scriptSha,
      1,
      key,
      now,
      windowMs,
      limit,
      member,
      windowSec
    );
  } catch (err) {
    // NOSCRIPT can happen if Redis restarted and flushed its script cache
    if (err.message.includes('NOSCRIPT')) {
      await loadScript();
      result = await redisClient.evalsha(
        scriptSha, 1, key, now, windowMs, limit, member, windowSec
      );
    } else {
      throw err;
    }
  }

  const [allowed, remaining] = result;
  return { allowed: allowed === 1, remaining };
};

module.exports = { checkRateLimit };
