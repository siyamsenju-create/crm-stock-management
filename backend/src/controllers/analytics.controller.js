const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * @desc    Get dashboard analytics
 * @route   GET /api/v1/analytics
 * @access  Private
 */
exports.getDashboardAnalytics = asyncHandler(async (req, res) => {
  const [totalProducts, lowStockItems, inventoryStats, transactionStats, recentActivity] =
    await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({
        $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
      }),
      Product.aggregate([
        {
          $group: {
            _id: null,
            totalInventoryValue: { $sum: { $multiply: ['$price', '$quantity'] } },
            totalStockQuantity: { $sum: '$quantity' },
          },
        },
      ]),
      Transaction.aggregate([
        {
          $group: {
            _id: '$type',
            totalQuantity: { $sum: '$quantity' },
          },
        },
      ]),
      Product.find().sort('-createdAt').limit(5).select('name quantity category createdAt'),
    ]);

  const { totalInventoryValue = 0, totalStockQuantity = 0 } =
    inventoryStats[0] || {};

  let totalStockInflow = 0;
  let totalStockOutflow = 0;
  transactionStats.forEach((s) => {
    if (s._id === 'IN') totalStockInflow = s.totalQuantity;
    if (s._id === 'OUT') totalStockOutflow = s.totalQuantity;
  });

  sendSuccess(res, 200, 'Analytics fetched successfully', {
    totalProducts,
    lowStockItems,
    totalInventoryValue,
    totalStockQuantity,
    totalStockInflow,
    totalStockOutflow,
    netInventoryMovement: totalStockInflow - totalStockOutflow,
    recentActivity,
  });
});
