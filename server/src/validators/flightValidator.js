const Joi = require('joi');

const searchSchema = Joi.object({
  source: Joi.string().length(3).uppercase().required(), // IATA code e.g. "DEL"
  destination: Joi.string().length(3).uppercase().required(),
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({ 'string.pattern.base': 'date must be YYYY-MM-DD' }),
  class: Joi.string().valid('economy', 'premium_economy', 'business').default('economy'),
  passengers: Joi.number().integer().min(1).max(9).default(1),
});

const createFlightSchema = Joi.object({
  flightNumber: Joi.string().required(),
  airline: Joi.string().hex().length(24).required(), // MongoDB ObjectId
  source: Joi.string().hex().length(24).required(),
  destination: Joi.string().hex().length(24).required(),
  departureTime: Joi.date().iso().required(),
  arrivalTime: Joi.date().iso().greater(Joi.ref('departureTime')).required(),
  price: Joi.object({
    economy: Joi.number().positive().required(),
    premium_economy: Joi.number().positive(),
    business: Joi.number().positive(),
  }).required(),
  seats: Joi.array()
    .items(
      Joi.object({
        seatNumber: Joi.string().required(),
        class: Joi.string().valid('economy', 'premium_economy', 'business').required(),
      })
    )
    .min(1)
    .required(),
});

module.exports = { searchSchema, createFlightSchema };
