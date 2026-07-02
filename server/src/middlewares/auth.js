const { verifyToken } = require('../utils/jwt');
const { AppError } = require('./errorHandler');

const extractToken = (req) => {
  // Prefer cookie (web flow); fall back to Authorization header (mobile/API clients)
  if (req.cookies?.token) return req.cookies.token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

/**
 * protect: REQUIRES a valid token. Use on routes only logged-in users can hit
 * (e.g. POST /bookings).
 */
const protect = (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next(new AppError('Not authenticated', 401));

  try {
    req.user = verifyToken(token); // { id, role }
    next();
  } catch (err) {
    next(new AppError('Invalid or expired token', 401));
  }
};

/**
 * optionalAuth: attaches req.user IF a valid token exists, but does NOT
 * reject the request if there's none. Needed for routes guests can access
 * (flight search) where the rate limiter still needs to know "is this a
 * logged-in user or a guest" to pick the right limit.
 */
const optionalAuth = (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  try {
    req.user = verifyToken(token);
  } catch (err) {
    // invalid/expired token on an optional route -> just treat as guest, don't error
  }
  next();
};

/**
 * restrictTo('admin'): role guard, used AFTER protect().
 * Usage: router.delete('/flights/:id', protect, restrictTo('admin'), ctrl)
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(new AppError('Forbidden: insufficient permissions', 403));
  }
  next();
};

module.exports = { protect, optionalAuth, restrictTo };
