
const router = require('express').Router();
const ctrl = require('../controllers/flightController');
const { protect, optionalAuth, restrictTo } = require('../middlewares/auth');
const rateLimiter = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validate');
const { searchSchema, createFlightSchema } = require('../validators/flightValidator');

/**
 * @swagger
 * tags:
 *   name: Flights
 *   description: Flight search and management
 */

/**
 * @swagger
 * /flights/search:
 *   get:
 *     summary: Search available flights
 *     tags: [Flights]
 *     parameters:
 *       - in: query
 *         name: source
 *         required: true
 *         schema:
 *           type: string
 *           example: DEL
 *       - in: query
 *         name: destination
 *         required: true
 *         schema:
 *           type: string
 *           example: BOM
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           example: "2026-07-15"
 *       - in: query
 *         name: class
 *         schema:
 *           type: string
 *           enum: [economy, premium_economy, business]
 *           default: economy
 *       - in: query
 *         name: passengers
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: List of available flights (cached in Redis for 5 min)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Flight'
 *       429:
 *         description: Too many requests (Sliding Window Rate Limiter)
 */
router.get('/search', optionalAuth, rateLimiter, validate(searchSchema), ctrl.searchFlights);
/**
 * @swagger
 * /flights/airports:
 *   get:
 *     summary: Get all airports (cached 1 hour)
 *     tags: [Flights]
 *     responses:
 *       200:
 *         description: List of airports
 */
router.get('/airports', optionalAuth, rateLimiter, ctrl.getAllAirports);

/**
 * @swagger
 * /flights/{id}:
 *   get:
 *     summary: Get flight details by ID
 *     tags: [Flights]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Flight details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Flight'
 *       404:
 *         description: Flight not found
 */
router.get('/:id', optionalAuth, rateLimiter, ctrl.getFlightById);

/**
 * @swagger
 * /flights/{id}/seats:
 *   get:
 *     summary: Get live seat map for a flight
 *     description: Returns each seat with status - available, locked (Redis TTL), or booked (DB)
 *     tags: [Flights]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Seat map with live lock statuses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     seatMap:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Seat'
 */
router.get('/:id/seats', optionalAuth, rateLimiter, ctrl.getSeatMap);

/**
 * @swagger
 * /flights:
 *   get:
 *     summary: Get all flights (Admin only)
 *     tags: [Flights]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All flights
 *       403:
 *         description: Forbidden
 *   post:
 *     summary: Create a new flight (Admin only)
 *     tags: [Flights]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [flightNumber, airline, source, destination, departureTime, arrivalTime, price, seats]
 *             properties:
 *               flightNumber:
 *                 type: string
 *                 example: AI-101
 *               airline:
 *                 type: string
 *                 example: 64a1b2c3d4e5f6a7b8c9d0e1
 *               source:
 *                 type: string
 *                 example: 64a1b2c3d4e5f6a7b8c9d0e2
 *               destination:
 *                 type: string
 *                 example: 64a1b2c3d4e5f6a7b8c9d0e3
 *               departureTime:
 *                 type: string
 *                 format: date-time
 *               arrivalTime:
 *                 type: string
 *                 format: date-time
 *               price:
 *                 type: object
 *                 properties:
 *                   economy:
 *                     type: number
 *                     example: 4500
 *     responses:
 *       201:
 *         description: Flight created
 *       403:
 *         description: Forbidden
 */
router.get('/', protect, restrictTo('admin'), ctrl.getAllFlights);
router.post('/', protect, restrictTo('admin'), validate(createFlightSchema), ctrl.createFlight);

/**
 * @swagger
 * /flights/{id}:
 *   patch:
 *     summary: Update a flight (Admin only)
 *     tags: [Flights]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Flight updated, search cache invalidated
 *       403:
 *         description: Forbidden
 *   delete:
 *     summary: Delete a flight (Admin only)
 *     tags: [Flights]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Flight deleted
 */
router.patch('/:id', protect, restrictTo('admin'), ctrl.updateFlight);
router.delete('/:id', protect, restrictTo('admin'), ctrl.deleteFlight);

module.exports = router;
