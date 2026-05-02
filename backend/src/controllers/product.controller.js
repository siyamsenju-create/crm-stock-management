const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const { invalidateCache } = require('../utils/cache');
const logger = require('../utils/logger');

// ── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Create new product
 * @route   POST /api/v1/products
 * @access  Private/Admin/Manager
 */
exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);

  // Record initial stock as an IN transaction
  if (product.quantity > 0) {
    await Transaction.create({
      productId: product._id,
      type: 'IN',
      quantity: product.quantity,
      reference: 'Initial Stock',
    });
  }

  await invalidateCache('products');

  logger.info('Product created', { productId: product._id, name: product.name });

  sendSuccess(res, 201, 'Product created successfully', product);
});

/**
 * @desc    Get all products with search, filter, sort & pagination
 * @route   GET /api/v1/products
 * @access  Private
 */
exports.getProducts = asyncHandler(async (req, res) => {
  // Build filter from query (non-special fields)
  const excluded = ['select', 'sort', 'page', 'limit', 'search'];
  const rawFilter = { ...req.query };
  excluded.forEach((k) => delete rawFilter[k]);

  // Convert operator shorthand: price[gt] → { $gt: value }
  let filterStr = JSON.stringify(rawFilter);
  filterStr = filterStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (m) => `$${m}`);
  const filter = JSON.parse(filterStr);

  // Full-text search on name
  if (req.query.search) {
    filter.name = { $regex: req.query.search, $options: 'i' };
  }

  const { data: products, pagination } = await req.paginate(Product, filter);

  sendSuccess(res, 200, 'Products fetched successfully', products, pagination);
});

/**
 * @desc    Get single product by ID
 * @route   GET /api/v1/products/:id
 * @access  Private
 */
exports.getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw AppError.notFound('Product');
  }

  sendSuccess(res, 200, 'Product fetched successfully', product);
});

/**
 * @desc    Update product (quantity updates blocked — use transactions)
 * @route   PUT /api/v1/products/:id
 * @access  Private/Admin/Manager
 */
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw AppError.notFound('Product');
  }

  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  await invalidateCache('products');

  logger.info('Product updated', { productId: updated._id });

  sendSuccess(res, 200, 'Product updated successfully', updated);
});

/**
 * @desc    Delete product
 * @route   DELETE /api/v1/products/:id
 * @access  Private/Admin
 */
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw AppError.notFound('Product');
  }

  await product.deleteOne();
  await invalidateCache('products');

  logger.info('Product deleted', { productId: req.params.id });

  sendSuccess(res, 200, 'Product deleted successfully');
});

/**
 * @desc    Get low-stock products
 * @route   GET /api/v1/products/alerts/low-stock
 * @access  Private
 */
exports.getLowStockAlerts = asyncHandler(async (req, res) => {
  const lowStockProducts = await Product.find({
    $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
  });

  sendSuccess(res, 200, 'Low stock alerts fetched', lowStockProducts, {
    count: lowStockProducts.length,
  });
});
