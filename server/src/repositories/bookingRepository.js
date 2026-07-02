const Booking = require('../models/Booking');

const create = (data) => Booking.create(data);

const findByUser = (userId) =>
  Booking.find({ user: userId })
    .populate('flight', 'flightNumber departureTime arrivalTime')
    .sort({ createdAt: -1 })
    .lean();

const findById = (id) =>
  Booking.findById(id)
    .populate('flight')
    .populate('user', 'name email');

const findByReference = (ref) => Booking.findOne({ bookingReference: ref });

const updateStatus = (id, status) =>
  Booking.findByIdAndUpdate(id, { status }, { new: true });

module.exports = { create, findByUser, findById, findByReference, updateStatus };
