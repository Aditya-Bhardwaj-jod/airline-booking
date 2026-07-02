const swaggerJsdoc = require('swagger-jsdoc');

/**
 * Why swagger-jsdoc over a static swagger.json:
 * - Docs live next to the code they describe (JSDoc comments in route files)
 * - When a route changes, the dev updates the comment right there — less drift
 * - Static JSON files go stale because devs forget to update a separate file
 */
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Airline Booking API',
      version: '1.0.0',
      description:
        'Production-grade airline ticket booking system. Features custom Sliding Window Rate Limiter, Redis Seat Lock, and clean layered architecture.',
      contact: { name: 'Aditya Bhardwaj', url: 'https://github.com/Aditya-Bhardwaj-jod' },
    },
    servers: [{ url: '/api', description: 'API base' }],
    components: {
      securitySchemes: {
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'token' },
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Something went wrong' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e1' },
            name: { type: 'string', example: 'Aditya Bhardwaj' },
            email: { type: 'string', example: 'aditya@example.com' },
            role: { type: 'string', enum: ['user', 'admin'] },
          },
        },
        Airport: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            code: { type: 'string', example: 'DEL' },
            name: { type: 'string', example: 'Indira Gandhi International Airport' },
            city: { type: 'string', example: 'New Delhi' },
            country: { type: 'string', example: 'India' },
          },
        },
        Seat: {
          type: 'object',
          properties: {
            seatNumber: { type: 'string', example: '12A' },
            class: { type: 'string', enum: ['economy', 'premium_economy', 'business'] },
            status: { type: 'string', enum: ['available', 'locked', 'booked'] },
          },
        },
        Flight: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            flightNumber: { type: 'string', example: 'AI-101' },
            airline: { type: 'object', properties: { code: { type: 'string' }, name: { type: 'string' } } },
            source: { $ref: '#/components/schemas/Airport' },
            destination: { $ref: '#/components/schemas/Airport' },
            departureTime: { type: 'string', format: 'date-time' },
            arrivalTime: { type: 'string', format: 'date-time' },
            price: {
              type: 'object',
              properties: {
                economy: { type: 'number', example: 4500 },
                premium_economy: { type: 'number', example: 8000 },
                business: { type: 'number', example: 15000 },
              },
            },
            status: { type: 'string', enum: ['scheduled', 'cancelled', 'departed'] },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            bookingReference: { type: 'string', example: 'PNR-A1B2C3' },
            flight: { $ref: '#/components/schemas/Flight' },
            seats: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  seatNumber: { type: 'string' },
                  class: { type: 'string' },
                  price: { type: 'number' },
                },
              },
            },
            totalAmount: { type: 'number', example: 9000 },
            status: { type: 'string', enum: ['confirmed', 'cancelled'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  // swagger-jsdoc will scan these files for @swagger JSDoc comments
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
