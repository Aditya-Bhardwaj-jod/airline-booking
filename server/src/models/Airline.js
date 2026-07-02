const mongoose = require('mongoose');

const airlineSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true }, // e.g. "AI"
    name: { type: String, required: true }, // e.g. "Air India"
    logoUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Airline', airlineSchema);
