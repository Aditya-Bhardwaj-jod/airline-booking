const User = require('../models/User');

/**
 * Repository layer: the ONLY place Mongoose User queries are written.
 * Services call these functions and never import the User model directly —
 * this is what lets us swap databases later without touching business logic.
 */
const findByEmail = (email, withPassword = false) => {
  const query = User.findOne({ email });
  return withPassword ? query.select('+password') : query;
};

const findById = (id) => User.findById(id);

const create = (data) => User.create(data);

module.exports = { findByEmail, findById, create };
