const bookingService = require('../services/bookingService');
const { asyncHandler } = require('../middlewares/errorHandler');

const lockSeat = asyncHandler(async (req, res) => {
  const result = await bookingService.lockSeat(
    req.body.flightId,
    req.body.seatNumber,
    req.user.id
  );
  res.json({ success: true, data: result });
});

const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.user.id, req.body);
  res.status(201).json({ success: true, data: booking });
});

const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await bookingService.getMyBookings(req.user.id);
  res.json({ success: true, data: bookings });
});

const getBookingById = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(
    req.params.id,
    req.user.id,
    req.user.role
  );
  res.json({ success: true, data: booking });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(req.params.id, req.user.id);
  res.json({ success: true, data: booking });
});

module.exports = { lockSeat, createBooking, getMyBookings, getBookingById, cancelBooking };
