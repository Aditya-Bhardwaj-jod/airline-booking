const mongoose = require('mongoose');

/**
 * Why we duplicate seatNumber + class + price INTO the booking
 * instead of just storing a reference to Flight and looking up seats live:
 *
 * Historical accuracy. If the flight's price changes tomorrow, or admin edits
 * the seat map, a booking made TODAY must still show what the user actually
 * paid and which seat they actually got. This is the same reason e-commerce
 * orders store a snapshot of product price at purchase time, not a live link
 * to the current product price.
 */
const bookedSeatSchema = new mongoose.Schema(
  {
    seatNumber: { type: String, required: true },
    class: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    flight: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight', required: true },

    seats: { type: [bookedSeatSchema], required: true },
    totalAmount: { type: Number, required: true },

    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },

    bookingReference: { type: String, required: true, unique: true }, // e.g. "PNR-A1B2C3"
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, createdAt: -1 }); // fast "my booking history" query

module.exports = mongoose.model('Booking', bookingSchema);
