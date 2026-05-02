const Product = require('../models/Product');
const Transaction = require('../models/Transaction');

// @desc    Clear all database collections (except users)
// @route   POST /api/v1/settings/factory-reset
// @access  Public / Private (depending on auth middleware in route)
exports.factoryReset = async (req, res, next) => {
  try {
    // Delete all products and transactions
    await Product.deleteMany({});
    await Transaction.deleteMany({});
    
    res.status(200).json({
      success: true,
      message: 'Factory reset successful. All data cleared.'
    });
  } catch (error) {
    next(error);
  }
};
