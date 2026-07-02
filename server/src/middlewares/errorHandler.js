const logger = require('../config/logger');

/**
 * Custom error class so services can throw meaningful, typed errors
 * instead of generic `throw new Error("something broke")`.
 * Usage in a service: throw new AppError('Seat already locked', 409);
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // distinguishes expected errors from bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Why ONE centralized error handler instead of try/catch + res.status() in every controller:
 * - DRY: error response shape is consistent everywhere ({ success, message })
 * - Controllers just `next(err)` and forget about formatting
 * - Easy to add Sentry/error-tracking later in this single place
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`);

  res.status(statusCode).json({
    success: false,
    message: err.isOperational ? err.message : 'Internal server error',
  });
};

// Wrap async controller functions so we don't write try/catch in every single one
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { AppError, errorHandler, asyncHandler };
