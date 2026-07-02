const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const { signToken } = require('../utils/jwt');
const { AppError } = require('../middlewares/errorHandler');

const SALT_ROUNDS = 10; // industry-standard tradeoff: high enough to resist brute force,
// low enough to not make every login request noticeably slow (~100ms)

const signup = async ({ name, email, password }) => {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userRepository.create({ name, email, password: hashedPassword });

  const token = signToken(user);
  return { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } };
};

const login = async ({ email, password }) => {
  // withPassword=true because the schema has select:false on password by default
  const user = await userRepository.findByEmail(email, true);

  // Same error message for "no such user" and "wrong password" — this prevents
  // an attacker from using the login endpoint to enumerate which emails are registered.
  if (!user) throw new AppError('Invalid email or password', 401);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  const token = signToken(user);
  return { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } };
};

module.exports = { signup, login };
