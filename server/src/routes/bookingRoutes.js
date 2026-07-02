const router = require('express').Router();
const ctrl = require('../controllers/bookingController');
const { protect, restrictTo } = require('../middlewares/auth');
const rateLimiter = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validate');
const { lockSeatSchema, createBookingSchema } = require('../validators/bookingValidator');

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Seat locking and booking management
 */

router.use(protect, rateLimiter);

/**
 * @swagger
 * /bookings/lock-seat:
 *   post:
 *     summary: Temporarily lock a seat (5 minutes)
 *     description: |
 *       Uses Redis SET NX EX to atomically acquire a seat lock.
 *       Returns 409 if seat is already locked by another user.
 *       Lock auto-releases after 5 minutes if booking is not completed.
 *     tags: [Bookings]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [flightId, seatNumber]
 *             properties:
 *               flightId:
 *                 type: string
 *                 example: 64a1b2c3d4e5f6a7b8c9d0e1
 *               seatNumber:
 *                 type: string
 *                 example: 12A
 *     responses:
 *       200:
 *         description: Seat locked successfully for 5 minutes
 *       409:
 *         description: Seat already booked or temporarily reserved
 *       429:
 *         description: Too many requests
 */
router.post('/lock-seat', validate(lockSeatSchema), ctrl.lockSeat);

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Confirm a booking
 *     description: |
 *       Verifies Redis seat locks, runs a MongoDB transaction to mark
 *       seats as booked and create a booking record, then releases locks.
 *     tags: [Bookings]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [flightId, seats]
 *             properties:
 *               flightId:
 *                 type: string
 *               seats:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     seatNumber:
 *                       type: string
 *                       example: 12A
 *                     class:
 *                       type: string
 *                       example: economy
 *     responses:
 *       201:
 *         description: Booking confirmed with PNR
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       409:
 *         description: Seat lock expired or seat taken
 */
router.post('/', validate(createBookingSchema), ctrl.createBooking);

/**
 * @swagger
 * /bookings/my:
 *   get:
 *     summary: Get current user's booking history
 *     tags: [Bookings]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings sorted by newest first
 */
router.get('/my', ctrl.getMyBookings);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get a booking by ID (owner or admin)
 *     tags: [Bookings]
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
 *         description: Booking details
 *       403:
 *         description: Not your booking
 *       404:
 *         description: Booking not found
 */
router.get('/:id', ctrl.getBookingById);

/**
 * @swagger
 * /bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel a booking
 *     description: Frees seats in the Flight document inside a MongoDB transaction.
 *     tags: [Bookings]
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
 *         description: Booking cancelled, seats freed
 *       403:
 *         description: Not your booking
 *       409:
 *         description: Already cancelled
 */
router.patch('/:id/cancel', ctrl.cancelBooking);

module.exports = router;
