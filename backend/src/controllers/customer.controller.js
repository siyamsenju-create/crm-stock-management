const Customer = require('../models/Customer');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// ── Security helpers ──────────────────────────────────────────────────────────

/**
 * Returns true if the value is a primitive safe for MongoDB storage.
 * Rejects objects, arrays, and any value that could carry operator keys.
 */
function isSafePrimitive(value) {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

/**
 * Returns true if a string key starts with '$', which would be treated as a
 * MongoDB operator and enable NoSQL injection.
 */
function isMongoOperator(key) {
  return typeof key === 'string' && key.startsWith('$');
}

/**
 * Validates and sanitises a single string field value.
 * Rejects anything that is not a plain, non-empty string (or null to clear it).
 */
function sanitiseString(value, fieldName) {
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw AppError.badRequest(`Field "${fieldName}" must be a string.`);
  }
  // Reject any value that itself looks like an operator object serialised as string
  const trimmed = value.trim();
  return trimmed;
}

// ── Controllers ───────────────────────────────────────────────────────────────

exports.createCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.create(req.body);
  logger.info('Customer created', { customerId: customer._id });
  sendSuccess(res, 201, 'Customer created successfully', customer);
});

exports.getCustomers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.search) {
    filter.name = { $regex: req.query.search, $options: 'i' };
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const { data: customers, pagination } = await req.paginate(Customer, filter);
  sendSuccess(res, 200, 'Customers fetched successfully', customers, pagination);
});

exports.getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    throw AppError.notFound('Customer');
  }
  sendSuccess(res, 200, 'Customer fetched successfully', customer);
});

exports.updateCustomer = asyncHandler(async (req, res) => {
  // ── 1. Reject top-level MongoDB operator keys in req.body ─────────────────
  for (const key of Object.keys(req.body)) {
    if (isMongoOperator(key)) {
      throw AppError.badRequest(
        `Invalid field name "${key}": MongoDB operators are not permitted.`
      );
    }
  }

  // ── 2. Per-field explicit type validation & sanitisation ──────────────────
  //    Only the fields defined in the Customer schema are allowed.
  //    Schema: name(String), email(String), phone(String), location(String),
  //            status(enum: Active|Inactive)
  const safeUpdates = {};

  if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
    const v = req.body.name;
    if (!isSafePrimitive(v)) throw AppError.badRequest('Field "name" must be a string or null.');
    const sanitised = sanitiseString(v, 'name');
    if (sanitised !== null && sanitised.length === 0) throw AppError.badRequest('Field "name" cannot be empty.');
    safeUpdates.name = sanitised;
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'email')) {
    const v = req.body.email;
    if (!isSafePrimitive(v)) throw AppError.badRequest('Field "email" must be a string or null.');
    const sanitised = sanitiseString(v, 'email');
    if (sanitised !== null && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitised)) {
      throw AppError.badRequest('Field "email" must be a valid email address.');
    }
    safeUpdates.email = sanitised;
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'phone')) {
    const v = req.body.phone;
    if (!isSafePrimitive(v)) throw AppError.badRequest('Field "phone" must be a string or null.');
    safeUpdates.phone = sanitiseString(v, 'phone');
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'location')) {
    const v = req.body.location;
    if (!isSafePrimitive(v)) throw AppError.badRequest('Field "location" must be a string or null.');
    safeUpdates.location = sanitiseString(v, 'location');
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'status')) {
    const v = req.body.status;
    if (typeof v !== 'string') throw AppError.badRequest('Field "status" must be a string.');
    if (!['Active', 'Inactive'].includes(v)) {
      throw AppError.badRequest('Field "status" must be "Active" or "Inactive".');
    }
    safeUpdates.status = v;
  }

  if (Object.keys(safeUpdates).length === 0) {
    throw AppError.badRequest('No valid fields provided for update.');
  }

  // ── 3. Use explicit $set to prevent operator injection reaching the driver ─
  //    Wrapping in { $set: safeUpdates } ensures Mongoose never interprets
  //    safeUpdates keys as top-level update operators.
  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    { $set: safeUpdates },
    {
      new: true,
      runValidators: true,
      strict: true,
      context: 'query',
    }
  );

  if (!customer) {
    throw AppError.notFound('Customer');
  }

  logger.info('Customer updated', { customerId: customer._id });
  sendSuccess(res, 200, 'Customer updated successfully', customer);
});

exports.deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) {
    throw AppError.notFound('Customer');
  }
  logger.info('Customer deleted', { customerId: customer._id });
  sendSuccess(res, 200, 'Customer deleted successfully');
});
