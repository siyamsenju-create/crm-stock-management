const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Protect middleware — verifies Bearer JWT and attaches req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(AppError.unauthorized());
  }

  // Throws JsonWebTokenError / TokenExpiredError — caught by error middleware
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(AppError.unauthorized('The user belonging to this token no longer exists.'));
  }

  req.user = currentUser;
  next();
});

/**
 * Authorize middleware — restricts access to specific roles.
 * Must be called AFTER protect.
 *
 * @param {...string} roles - Allowed role names (e.g. 'Admin', 'Manager')
 * @returns {import('express').RequestHandler}
 */
const authorize = (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `Your account role '${req.user.role}' is not authorized to perform this action.`
        )
      );
    }
    next();
  };

module.exports = { protect, authorize };
