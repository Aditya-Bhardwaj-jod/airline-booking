const authService = require('../services/authService');
const { asyncHandler } = require('../middlewares/errorHandler');
const env = require('../config/env');

/**
 * Why httpOnly cookie for the JWT instead of returning it in the JSON body
 * for the frontend to store in localStorage:
 * - localStorage is readable by ANY JavaScript on the page -> vulnerable to
 *   XSS (a malicious script can steal the token).
 * - An httpOnly cookie is invisible to JavaScript entirely; the browser
 *   attaches it to requests automatically. This is the standard mitigation
 *   for token theft via XSS.
 * We still ALSO return the token in the response body for cases like mobile
 * clients that can't rely on cookies — but the web frontend will use the cookie.
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.nodeEnv === 'production', // only over HTTPS in prod
  sameSite: 'strict', // CSRF mitigation
  maxAge: 15 * 60 * 1000, // 15 minutes, matches JWT_EXPIRES_IN
};

const signup = asyncHandler(async (req, res) => {
  const { token, user } = await authService.signup(req.body);
  res.cookie('token', token, COOKIE_OPTIONS);
  res.status(201).json({ success: true, data: { user, token } });
});

const login = asyncHandler(async (req, res) => {
  const { token, user } = await authService.login(req.body);
  res.cookie('token', token, COOKIE_OPTIONS);
  res.status(200).json({ success: true, data: { user, token } });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.status(200).json({ success: true, message: 'Logged out' });
});

module.exports = { signup, login, logout };
