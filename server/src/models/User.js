const mongoose = require('mongoose');

/**
 * Why password is select: false:
 * By default, any User.find() query would otherwise return the hashed password
 * to every part of the app (and risk being sent in an API response by accident).
 * We explicitly .select('+password') only in the login service where it's needed.
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['user', 'admin'], // Guest = unauthenticated, not stored in DB
      default: 'user',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
