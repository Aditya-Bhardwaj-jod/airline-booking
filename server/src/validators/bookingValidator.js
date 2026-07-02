const Joi = require('joi');

const lockSeatSchema = Joi.object({
  flightId: Joi.string().hex().length(24).required(),
  seatNumber: Joi.string().required(),
});

const createBookingSchema = Joi.object({
  flightId: Joi.string().hex().length(24).required(),
  seats: Joi.array()
    .items(
      Joi.object({
        seatNumber: Joi.string().required(),
        class: Joi.string().valid('economy', 'premium_economy', 'business').required(),
      })
    )
    .min(1)
    .max(9)
    .required(),
});

module.exports = { lockSeatSchema, createBookingSchema };
