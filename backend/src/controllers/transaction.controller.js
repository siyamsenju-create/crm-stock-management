const Transaction = require('../models/Transaction');
const Product = require('../models/Product');

// @desc    Add stock movement
// @route   POST /api/v1/transactions
// @access  Private
exports.addTransaction = async (req, res, next) => {
  try {
    const { productId, type, quantity, reference } = req.body;

    // Validate required fields manually to provide clear error messages
    if (!productId || !type || !quantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide productId, type (IN/OUT), and quantity' 
      });
    }

    if (type !== 'IN' && type !== 'OUT') {
      return res.status(400).json({ 
        success: false, 
        message: 'Transaction type must be either IN or OUT' 
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Quantity must be at least 1' 
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check for negative stock if type is OUT
    if (type === 'OUT' && product.quantity < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock to perform this transaction' });
    }

    // Create transaction
    const transaction = await Transaction.create({
      productId,
      type,
      quantity,
      reference
    });

    // Update product stock
    product.quantity = type === 'IN' ? product.quantity + quantity : product.quantity - quantity;
    await product.save();

    res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get transaction history
// @route   GET /api/v1/transactions
// @access  Private
exports.getTransactions = async (req, res, next) => {
  try {
    const { product, startDate, endDate, type } = req.query;
    
    let query = {};
    
    if (product) query.productId = product;
    if (type) query.type = type;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('productId', 'name price category')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (err) {
    next(err);
  }
};
