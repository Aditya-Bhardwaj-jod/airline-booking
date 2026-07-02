const Joi = require('joi');

/**
 * Why validate here, separate from the Mongoose schema:
 * Mongoose validation runs AFTER we've already done work (hashing password etc.)
 * and its error messages aren't great for API responses. Validating at the
 * door (middleware, before the controller even runs) means we reject garbage
 * input immediately with clear, predictable error shapes — "never trust
 * frontend data" applies here.
 */
const signupSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(72).required(), // 72 = bcrypt's max input length
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

module.exports = { signupSchema, loginSchema };
