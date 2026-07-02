const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

/**
 * Why a dedicated connectDB function instead of mongoose.connect() inline in server.js:
 * - Keeps server.js focused only on "start the HTTP server"
 * - Lets us add connection event listeners (disconnect, reconnect) in ONE place
 * - Makes it trivial to mock/skip DB connection in tests
 */
const connectDB = async () => {
  try {
    await mongoose.connect(env.mongoUri);
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1); // fail fast — app is useless without DB
  }
};

mongoose.connection.on('disconnected', () => {
  logger.error('MongoDB disconnected');
});

module.exports = connectDB;
