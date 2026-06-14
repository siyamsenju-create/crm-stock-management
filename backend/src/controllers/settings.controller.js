const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * @desc    Hard-delete all business data (products, transactions, orders, customers).
 *          Users are intentionally preserved.
 * @route   POST /api/v1/settings/factory-reset
 * @access  Private — Admin only
 */
exports.factoryReset = asyncHandler(async (req, res) => {
  // ── Audit trail ─────────────────────────────────────────────────────────────
  // This action is destructive and irreversible; always log who triggered it.
  logger.warn('FACTORY RESET INITIATED', {
    triggeredBy: {
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
    },
    ip: req.ip,
    requestId: req.id,
    timestamp: new Date().toISOString(),
  });

  const [products, transactions, orders, customers] = await Promise.all([
    Product.deleteMany({}),
    Transaction.deleteMany({}),
    Order.deleteMany({}),
    Customer.deleteMany({}),
  ]);

  logger.warn('FACTORY RESET COMPLETED', {
    deletedCounts: {
      products: products.deletedCount,
      transactions: transactions.deletedCount,
      orders: orders.deletedCount,
      customers: customers.deletedCount,
    },
    triggeredBy: req.user._id,
  });

  sendSuccess(res, 200, 'Factory reset successful. All business data has been cleared.', {
    deletedCounts: {
      products: products.deletedCount,
      transactions: transactions.deletedCount,
      orders: orders.deletedCount,
      customers: customers.deletedCount,
    },
  });
});
