const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Centralizing JWT logic here so the secret/expiry is referenced in ONE place.
 * Payload kept minimal (id + role only) — never put sensitive data (email,
 * password hash) inside a JWT payload, since it's just Base64-encoded,
 * NOT encrypted, and readable by anyone who has the token.
 */
const signToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, env.jwt.secret); // throws if invalid/expired
};

module.exports = { signToken, verifyToken };
