const Customer = require('../models/Customer');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const logger = require('../utils/logger');

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
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
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
