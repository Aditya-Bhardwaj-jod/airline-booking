const { checkRateLimit } = require('../redis/rateLimiter');
const env = require('../config/env');

/**
 * Role-aware rate limiting:
 *   Guest (no JWT)  -> limited by IP address, low limit
 *   User            -> limited by userId, medium limit
 *   Admin           -> unlimited (skip check entirely)
 *
 * IMPORTANT: this middleware must run AFTER an optional-auth middleware
 * that attaches req.user if a valid JWT is present, but does NOT reject
 * the request if there's no token (guests are allowed to browse/search).
 */
const rateLimiterMiddleware = async (req, res, next) => {
  const role = req.user?.role || 'guest';

  if (role === 'admin') return next(); // admins bypass entirely

  const identifier = req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
  const limit = role === 'user' ? env.rateLimit.user : env.rateLimit.guest;
  const windowSec = env.rateLimit.windowSec;

  try {
    const { allowed, remaining } = await checkRateLimit(identifier, limit, windowSec);

    res.set('X-RateLimit-Limit', limit);
    res.set('X-RateLimit-Remaining', remaining);

    if (!allowed) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests',
        retryAfter: windowSec,
      });
    }

    next();
  } catch (err) {
    // If Redis itself is down, FAIL OPEN — same philosophy as cache.js.
    // A rate limiter that takes down the whole app when Redis hiccups is
    // worse than temporarily allowing extra traffic through.
    next();
  }
};

module.exports = rateLimiterMiddleware;
