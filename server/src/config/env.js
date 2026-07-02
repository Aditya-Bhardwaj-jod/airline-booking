require('dotenv').config();

/**
 * Centralized environment config.
 * Why: every other file imports FROM here, never from process.env directly.
 * This means if we rename an env var, we change it in ONE place.
 * It also lets us throw a clear error at boot time if something critical is missing,
 * instead of getting a cryptic crash 10 minutes later when a route is hit.
 */
const required = ['MONGO_URI', 'JWT_SECRET'];

for (const key of required) {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
}

module.exports = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 5000,

    mongoUri: process.env.MONGO_URI,

    redis: {
        url: process.env.REDIS_URL || null,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    },

    rateLimit: {
        windowSec: parseInt(process.env.RATE_LIMIT_WINDOW_SEC, 10) || 60,
        guest: parseInt(process.env.RATE_LIMIT_GUEST, 10) || 20,
        user: parseInt(process.env.RATE_LIMIT_USER, 10) || 100,
    },

    seatLock: {
        ttlSec: parseInt(process.env.SEAT_LOCK_TTL_SEC, 10) || 300,
    },

    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};