const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * @desc    Add stock movement (IN/OUT)
 * @route   POST /api/v1/transactions
 * @access  Private
 */
exports.addTransaction = asyncHandler(async (req, res) => {
  const { productId, type, quantity, reference } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    throw AppError.notFound('Product');
  }

  if (type === 'OUT' && product.quantity < quantity) {
    throw AppError.badRequest(
      `Insufficient stock. Available: ${product.quantity}, Requested: ${quantity}.`,
      'INSUFFICIENT_STOCK'
    );
  }

  const transaction = await Transaction.create({ productId, type, quantity, reference });

  // Atomically update stock
  product.quantity = type === 'IN' ? product.quantity + quantity : product.quantity - quantity;
  await product.save();

  // Emit real-time event if socket.io is available
  const io = req.app.get('io');
  if (io) {
    io.emit('stock:updated', {
      productId: product._id,
      productName: product.name,
      newQuantity: product.quantity,
      transactionType: type,
      quantity,
    });
  }

  logger.info('Stock transaction recorded', {
    transactionId: transaction._id,
    productId,
    type,
    quantity,
    newStock: product.quantity,
  });

  sendSuccess(res, 201, 'Transaction recorded successfully', transaction);
});

/**
 * @desc    Get transaction history with filters & pagination
 * @route   GET /api/v1/transactions
 * @access  Private
 */
exports.getTransactions = asyncHandler(async (req, res) => {
  const filter = {};
  const { product, type, startDate, endDate } = req.query;

  if (product) filter.productId = product;
  if (type) filter.type = type;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const { data: transactions, pagination } = await req.paginate(
    Transaction,
    filter,
    null,
    { path: 'productId', select: 'name price category' }
  );

  sendSuccess(res, 200, 'Transactions fetched successfully', transactions, pagination);
});
