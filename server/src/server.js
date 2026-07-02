const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const logger = require('./config/logger');
require('./config/redisClient');

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION:', err);
    process.exit(1);
});

const start = async() => {
    try {
        await connectDB();
        app.listen(env.port, () => {
            console.log(`Server running on port ${env.port}`);
        });
    } catch (err) {
        console.error('STARTUP ERROR:', err);
        process.exit(1);
    }
};

start();