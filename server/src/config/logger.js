const winston = require('winston');
const path = require('path');

/**
 * Why Winston over console.log:
 * - Structured logs (JSON) are machine-parseable -> can feed into ELK/Datadog later
 * - Separate log levels (error vs info) -> separate files, easier debugging in prod
 * - console.log in production is slow (blocking) and gives no severity/timestamps
 */
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../src/logs/error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../src/logs/access.log'),
    }),
  ],
});

// In dev, also print to console in a human-readable way
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

module.exports = logger;
