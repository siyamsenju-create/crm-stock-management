const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const logger = require('../utils/logger');
const { verifyFirebaseIdToken } = require('../utils/firebaseAuth');


// ── Token generation ─────────────────────────────────────────────────────────

const generateTokens = (id) => {
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });

  const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  return { accessToken, refreshToken };
};

// ── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Register user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw AppError.conflict('An account with this email already exists.');
  }

  const user = await User.create({ name, email, password, role });

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  logger.info('New user registered', { userId: user._id, role: user.role });

  sendSuccess(res, 201, 'User registered successfully', {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    accessToken,
    refreshToken,
  });
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    throw AppError.unauthorized('Invalid email or password.');
  }

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  logger.info('User logged in', { userId: user._id });

  sendSuccess(res, 200, 'Login successful', {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    accessToken,
    refreshToken,
  });
});

/**
 * @desc    Login/Register user via Google Auth (Firebase ID token)
 * @route   POST /api/v1/auth/google
 * @access  Public
 */
exports.googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  const googleUser = await verifyFirebaseIdToken(idToken);
  const { email, name } = googleUser;

  if (!email) {
    throw AppError.badRequest('Google account must provide an email address.');
  }

  let user = await User.findOne({ email });

  if (!user) {
    const randomPassword = crypto.randomBytes(32).toString('hex');
    user = await User.create({
      name: name || email.split('@')[0],
      email,
      password: randomPassword,
      role: 'User',
    });
    logger.info('Auto-registered new user via Google SSO', { userId: user._id });
  }

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  logger.info('User logged in via Google SSO', { userId: user._id });

  sendSuccess(res, 200, 'Login successful', {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    accessToken,
    refreshToken,
  });
});



/**
 * @desc    Refresh access token using refresh token
 * @route   POST /api/v1/auth/refresh
 * @access  Public
 */
exports.refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw AppError.forbidden('Invalid or expired refresh token. Please login again.');
  }

  const user = await User.findById(decoded.id);

  if (!user || user.refreshToken !== token) {
    throw AppError.forbidden('Refresh token mismatch. Please login again.');
  }

  const tokens = generateTokens(user._id);
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });

  sendSuccess(res, 200, 'Token refreshed successfully', {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
});

/**
 * @desc    Logout — invalidates the refresh token
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res) => {
  req.user.refreshToken = undefined;
  await req.user.save({ validateBeforeSave: false });

  logger.info('User logged out', { userId: req.user._id });

  sendSuccess(res, 200, 'Logged out successfully');
});

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'User profile fetched successfully', {
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    createdAt: req.user.createdAt,
  });
});

/**
 * @desc    Update current user profile
 * @route   PUT /api/v1/auth/profile
 * @access  Private
 *
 * Security (H-01): Uses an explicit allowlist to prevent mass assignment.
 * 'role' is intentionally excluded — it cannot be self-updated.
 * Password changes require the user to supply their current password.
 */
exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    throw AppError.notFound('User not found');
  }

  // ── Explicit allowlist (H-01) ─────────────────────────────────────────────
  // Only these fields may be updated via this endpoint. 'role', 'refreshToken',
  // '_id', '__v' and any other Mongoose internal are intentionally excluded.
  const ALLOWED_FIELDS = ['name', 'company', 'language', 'timezone', 'notifications'];

  ALLOWED_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  // Email change: verify new address is not already taken
  if (req.body.email && req.body.email !== user.email) {
    const emailTaken = await User.findOne({ email: req.body.email });
    if (emailTaken) throw AppError.conflict('That email address is already in use.');
    user.email = req.body.email;
  }

  // Password change: requires current password to prevent account takeover
  // Joi schema enforces that 'currentPassword' is always present with 'password'
  if (req.body.password) {
    const isMatch = await user.matchPassword(req.body.currentPassword);
    if (!isMatch) {
      throw AppError.unauthorized('Current password is incorrect.');
    }
    user.password = req.body.password;
  }

  await user.save();

  logger.info('User profile updated', { userId: user._id });

  sendSuccess(res, 200, 'Profile updated successfully', {
    _id: user._id,
    name: user.name,
    email: user.email,
    company: user.company,
    role: user.role,
    language: user.language,
    timezone: user.timezone,
    notifications: user.notifications,
  });
});
