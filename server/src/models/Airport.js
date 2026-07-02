const mongoose = require('mongoose');

/**
 * Airports are reference/lookup data — rarely written, frequently read.
 * This is exactly the kind of data we'll cache in Redis (Step on caching).
 */
const airportSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true }, // e.g. "DEL"
    name: { type: String, required: true }, // e.g. "Indira Gandhi International Airport"
    city: { type: String, required: true },
    country: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Airport', airportSchema);
