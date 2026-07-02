const mongoose = require('mongoose');

/**
 * Seat sub-document design decision:
 * We store EVERY seat as a sub-document with isBooked flag, rather than just
 * storing a "seats available" counter. Why? Because the feature requires
 * seat-level selection (user picks "12A" specifically) and a seat map UI —
 * a counter can't tell you WHICH seats are free.
 *
 * isBooked here means PERMANENTLY booked (confirmed in DB).
 * Temporary holds (user is mid-checkout) live in REDIS, not here —
 * that's the seat lock mechanism (Step: Seat Lock). Two different concerns:
 *   - Redis lock = "reserved for 5 min, might expire"
 *   - DB isBooked = "permanently sold, source of truth"
 */
const seatSchema = new mongoose.Schema(
  {
    seatNumber: { type: String, required: true }, // e.g. "12A"
    class: {
      type: String,
      enum: ['economy', 'premium_economy', 'business'],
      required: true,
    },
    isBooked: { type: Boolean, default: false },
  },
  { _id: false }
);

const flightSchema = new mongoose.Schema(
  {
    flightNumber: { type: String, required: true, unique: true, trim: true },
    airline: { type: mongoose.Schema.Types.ObjectId, ref: 'Airline', required: true },

    source: { type: mongoose.Schema.Types.ObjectId, ref: 'Airport', required: true },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Airport', required: true },

    // Always stored in UTC. Frontend converts to user's local timezone on display.
    departureTime: { type: Date, required: true },
    arrivalTime: { type: Date, required: true },

    seats: { type: [seatSchema], required: true },

    // Base price per class — actual displayed price may add taxes/fees at booking time.
    price: {
      economy: { type: Number, required: true },
      premium_economy: { type: Number },
      business: { type: Number },
    },

    status: {
      type: String,
      enum: ['scheduled', 'cancelled', 'departed'],
      default: 'scheduled',
    },
  },
  { timestamps: true }
);

// Compound index: this is THE most common query — "flights from X to Y on date D"
flightSchema.index({ source: 1, destination: 1, departureTime: 1 });

module.exports = mongoose.model('Flight', flightSchema);
