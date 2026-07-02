const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const logger = require('./config/logger');
require('./config/redisClient'); // side-effect import: initializes the shared Redis connection

/**
 * Why server.js is separate from app.js:
 * - app.js exports a pure Express app (no side effects) -> Supertest can import it
 *   directly in tests WITHOUT starting a real server or DB connection.
 * - server.js is the only file that actually calls app.listen() and connects to DB.
 */
const start = async () => {
  await connectDB();

  app.listen(env.port, () => {
    logger.info(`Server running on port ${env.port} [${env.nodeEnv}]`);
  });
};

start();
