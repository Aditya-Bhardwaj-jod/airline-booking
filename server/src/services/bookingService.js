const mongoose = require('mongoose');
const bookingRepository = require('../repositories/bookingRepository');
const flightRepository = require('../repositories/flightRepository');
const { acquireLock, releaseLock, verifyLock } = require('../redis/seatLock');
const { AppError } = require('../middlewares/errorHandler');
const { generatePNR } = require('../utils/pnr');

/**
 * LOCK SEAT
 * User selects a seat on the UI → we lock it in Redis for 5 min.
 * Only ONE user can hold the lock (NX flag ensures atomicity).
 */
const lockSeat = async (flightId, seatNumber, userId) => {
  // First verify seat exists and is not permanently booked
  const flight = await flightRepository.findById(flightId);
  if (!flight) throw new AppError('Flight not found', 404);

  const seat = flight.seats.find((s) => s.seatNumber === seatNumber);
  if (!seat) throw new AppError('Seat not found', 404);
  if (seat.isBooked) throw new AppError('Seat is already booked', 409);

  const acquired = await acquireLock(flightId, seatNumber, userId);
  if (!acquired) throw new AppError('Seat is temporarily reserved by another user', 409);

  return { message: 'Seat locked for 5 minutes', seatNumber, flightId };
};

/**
 * CREATE BOOKING
 * Full flow:
 * 1. Verify user holds Redis locks on ALL requested seats
 * 2. Open a MongoDB session + transaction (atomicity for multi-seat booking)
 * 3. Re-verify seats are not DB-booked (double check inside transaction)
 * 4. Mark seats as isBooked=true in Flight document
 * 5. Create Booking document with price snapshot
 * 6. Commit transaction
 * 7. Release Redis locks (DB is now the source of truth)
 *
 * WHY TRANSACTION:
 * If a user books 3 seats and the server crashes after marking seat 1 but
 * before marking seats 2 & 3, data is inconsistent. A MongoDB transaction
 * rolls back ALL changes if any step fails — all-or-nothing.
 */
const createBooking = async (userId, { flightId, seats }) => {
  // Step 1: verify Redis locks
  for (const { seatNumber } of seats) {
    const holdsLock = await verifyLock(flightId, seatNumber, userId);
    if (!holdsLock) {
      throw new AppError(
        `You do not hold the lock for seat ${seatNumber}. Please re-select your seat.`,
        409
      );
    }
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const flight = await flightRepository.findById(flightId);
    if (!flight) throw new AppError('Flight not found', 404);
    if (flight.status !== 'scheduled') throw new AppError('Flight is no longer available', 409);

    // Step 3: double-check each seat inside the transaction
    const bookedSeats = [];
    let totalAmount = 0;

    for (const { seatNumber, class: seatClass } of seats) {
      const seat = flight.seats.find((s) => s.seatNumber === seatNumber);
      if (!seat) throw new AppError(`Seat ${seatNumber} not found`, 404);
      if (seat.isBooked) throw new AppError(`Seat ${seatNumber} was just booked by someone else`, 409);

      const price = flight.price[seatClass];
      if (!price) throw new AppError(`No price defined for class ${seatClass}`, 400);

      // Step 4: mark as booked
      seat.isBooked = true;
      bookedSeats.push({ seatNumber, class: seatClass, price });
      totalAmount += price;
    }

    await flight.save({ session });

    // Step 5: create booking with snapshot
    const [booking] = await bookingRepository.create([
      {
        user: userId,
        flight: flightId,
        seats: bookedSeats,
        totalAmount,
        bookingReference: generatePNR(),
        status: 'confirmed',
      },
    ]);

    await session.commitTransaction();

    // Step 7: release Redis locks — DB is source of truth now
    for (const { seatNumber } of seats) {
      await releaseLock(flightId, seatNumber, userId);
    }

    return booking;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

/**
 * CANCEL BOOKING
 * 1. Verify booking belongs to the requesting user
 * 2. Free the seats in Flight document
 * 3. Mark booking as cancelled
 * All inside a transaction.
 */
const cancelBooking = async (bookingId, userId) => {
  const booking = await bookingRepository.findById(bookingId);
  if (!booking) throw new AppError('Booking not found', 404);
  if (booking.user._id.toString() !== userId.toString())
    throw new AppError('Not your booking', 403);
  if (booking.status === 'cancelled')
    throw new AppError('Booking is already cancelled', 409);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Free seats in Flight
    const flight = await flightRepository.findById(booking.flight._id);
    booking.seats.forEach(({ seatNumber }) => {
      const seat = flight.seats.find((s) => s.seatNumber === seatNumber);
      if (seat) seat.isBooked = false;
    });
    await flight.save({ session });

    booking.status = 'cancelled';
    await booking.save({ session });

    await session.commitTransaction();
    return booking;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

const getMyBookings = (userId) => bookingRepository.findByUser(userId);

const getBookingById = async (bookingId, userId, role) => {
  const booking = await bookingRepository.findById(bookingId);
  if (!booking) throw new AppError('Booking not found', 404);
  // Admin can view any booking; users can only view their own
  if (role !== 'admin' && booking.user._id.toString() !== userId.toString())
    throw new AppError('Not your booking', 403);
  return booking;
};

module.exports = { lockSeat, createBooking, cancelBooking, getMyBookings, getBookingById };
