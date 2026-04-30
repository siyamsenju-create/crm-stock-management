const Product = require('../models/Product');
const Transaction = require('../models/Transaction');

// @desc    Get dashboard analytics
// @route   GET /api/v1/analytics
// @access  Private
exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    // 1. Total products count
    const totalProducts = await Product.countDocuments();

    // 2. Low stock items
    const lowStockItems = await Product.countDocuments({
      $expr: { $lte: ["$quantity", "$lowStockThreshold"] }
    });

    // 3. Total inventory value & Total Stock Quantity using Aggregation
    const inventoryStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalInventoryValue: { $sum: { $multiply: ["$price", "$quantity"] } },
          totalStockQuantity: { $sum: "$quantity" }
        }
      }
    ]);

    const stats = inventoryStats.length > 0 ? inventoryStats[0] : { totalInventoryValue: 0, totalStockQuantity: 0 };
    delete stats._id;

    // 4. Transaction Stats (Total Inflow, Outflow, Net Movement)
    const transactionStats = await Transaction.aggregate([
      {
        $group: {
          _id: "$type",
          totalQuantity: { $sum: "$quantity" }
        }
      }
    ]);

    let totalStockInflow = 0;
    let totalStockOutflow = 0;

    transactionStats.forEach(stat => {
      if (stat._id === 'IN') totalStockInflow = stat.totalQuantity;
      if (stat._id === 'OUT') totalStockOutflow = stat.totalQuantity;
    });

    const netInventoryMovement = totalStockInflow - totalStockOutflow;

    // 5. Recent activity logs (mocking recent product additions for now)
    const recentActivity = await Product.find().sort('-createdAt').limit(5).select('name createdAt');

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        lowStockItems,
        totalInventoryValue: stats.totalInventoryValue,
        totalStockQuantity: stats.totalStockQuantity,
        totalStockInflow,
        totalStockOutflow,
        netInventoryMovement,
        recentActivity
      }
    });
  } catch (err) {
    next(err);
  }
};
