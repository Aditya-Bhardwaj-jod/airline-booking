const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger/swaggerConfig');
// Register all models
require('./models/User');
require('./models/Airport');
require('./models/Airline');
require('./models/Flight');
require('./models/Booking');
const env = require('./config/env');
const logger = require('./config/logger');
const { errorHandler, AppError } = require('./middlewares/errorHandler');

const app = express();

// ---- Security & parsing middleware ----
app.use(helmet()); // sets safe HTTP headers (XSS, sniffing protection etc.)
app.use(
    cors({
        origin: env.clientUrl,
        credentials: true, // needed because we'll use httpOnly cookies for JWT
    })
);
app.use(express.json());
app.use(cookieParser());
app.use(mongoSanitize()); // strips $ and . from req.body/query to prevent NoSQL injection

// ---- Logging ----
// morgan -> access.log via winston stream; keeps HTTP access logs separate from app logs
app.use(
    morgan('combined', {
        stream: { write: (msg) => logger.info(msg.trim()) },
    })
);

// ---- Swagger Docs ----
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ---- Health check (used by Docker healthcheck later) ----
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ---- Routes ----
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/flights', require('./routes/flightRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

// ---- 404 handler ----
app.use((req, res, next) => {
    next(new AppError(`Route not found: ${req.originalUrl}`, 404));
});

// ---- Centralized error handler (must be LAST) ----
app.use(errorHandler);

module.exports = app;