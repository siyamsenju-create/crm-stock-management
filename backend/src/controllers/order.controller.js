function isValidId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{10,36}$/.test(id);
}
const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const { invalidateCache } = require('../utils/cache');
const logger = require('../utils/logger');

// ── Security helpers ──────────────────────────────────────────────────────────

/**
 * Validates a single order line-item from req.body.
 * Returns a normalised { productId, quantity } or throws AppError.badRequest.
 *
 * CodeQL fix: every field that will reach a DB query is validated here,
 * before any Product.findById() call executes.
 */
function validateOrderItem(item, index) {
  // item must be a plain object (not null, array, primitive, or class instance)
  if (
    item === null ||
    typeof item !== 'object' ||
    Array.isArray(item)
  ) {
    throw AppError.badRequest(`items[${index}]: each item must be a plain object.`);
  }

  // Reject any MongoDB operator keys on the item itself
  for (const key of Object.keys(item)) {
    if (typeof key === 'string' && key.startsWith('$')) {
      throw AppError.badRequest(
        `items[${index}]: MongoDB operator key "${key}" is not permitted.`
      );
    }
  }

  // item.product must be a non-empty string that is a valid ObjectId
  if (!Object.prototype.hasOwnProperty.call(item, 'product')) {
    throw AppError.badRequest(`items[${index}]: "product" field is required.`);
  }
  if (typeof item.product !== 'string') {
    throw AppError.badRequest(`items[${index}]: "product" must be a string.`);
  }
  if (!isValidId(item.product)) {
    throw AppError.badRequest(`items[${index}]: "product" is not a valid ObjectId.`);
  }

  // item.quantity must be a positive integer
  if (!Object.prototype.hasOwnProperty.call(item, 'quantity')) {
    throw AppError.badRequest(`items[${index}]: "quantity" field is required.`);
  }
  const qty = Number(item.quantity);
  if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
    throw AppError.badRequest(
      `items[${index}]: "quantity" must be a positive integer, got "${item.quantity}".`
    );
  }

  return { productId: item.product, quantity: qty };
}

// ── Controllers ───────────────────────────────────────────────────────────────

exports.createOrder = asyncHandler(async (req, res) => {
  const { customer, items, status } = req.body;

  // ── Validate customer id ──────────────────────────────────────────────────
  if (typeof customer !== 'string' || !isValidId(customer)) {
    throw AppError.badRequest('Invalid customer id.');
  }

  // ── Validate items array ──────────────────────────────────────────────────
  if (!Array.isArray(items) || items.length === 0) {
    throw AppError.badRequest('"items" must be a non-empty array.');
  }

  // ── Phase 1: validate ALL items before ANY database query executes ────────
  //    CodeQL fix: build a fully-validated list so no unvalidated value
  //    can reach Product.findById().
  const validatedItems = items.map((item, index) => validateOrderItem(item, index));

  // ── Phase 2: now that every productId is a verified ObjectId string, ──────
  //    execute the database lookups safely.
  const customerObj = await Customer.findById(customer);
  if (!customerObj) throw AppError.notFound('Customer');

  let total = 0;
  const processedItems = [];

  for (const { productId, quantity } of validatedItems) {
    // productId is guaranteed to be a valid ObjectId string from Phase 1
    const product = await Product.findById(productId);
    if (!product) throw AppError.notFound(`Product not found: ${productId}`);

    if (status === 'Completed' && product.quantity < quantity) {
      throw AppError.badRequest(`Insufficient stock for product ${product.name}.`);
    }

    processedItems.push({
      product: product._id,
      quantity,
      price: product.price,
    });
    total += product.price * quantity;
  }

  // ── Phase 3: create the order ─────────────────────────────────────────────
  const order = await Order.create({
    customer,
    items: processedItems,
    total,
    status: status || 'Pending',
  });

  if (order.status === 'Completed') {
    // Deduct stock and log transactions
    for (const item of processedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: -item.quantity },
      });
      await Transaction.create({
        productId: item.product,
        type: 'OUT',
        quantity: item.quantity,
        reference: `Order ${order._id}`,
      });
    }
    // Update customer stats
    customerObj.ordersCount += 1;
    customerObj.totalSpent += total;
    await customerObj.save();
    await invalidateCache('products');
  }

  logger.info('Order created', { orderId: order._id });
  sendSuccess(res, 201, 'Order created successfully', order);
});

exports.getOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.customer) filter.customer = req.query.customer;
  if (req.query.status) filter.status = req.query.status;

  const { data: orders, pagination } = await req.paginate(Order, filter, null, { path: 'customer', select: 'name email' });
  sendSuccess(res, 200, 'Orders fetched successfully', orders, pagination);
});

exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'name email')
    .populate('items.product', 'name sku price');
  if (!order) throw AppError.notFound('Order');
  sendSuccess(res, 200, 'Order fetched successfully', order);
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw AppError.notFound('Order');

  if (order.status === 'Completed') {
    throw AppError.badRequest('Cannot change status of a completed order.');
  }

  if (status === 'Completed') {
    // Process stock deduction
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product.quantity < item.quantity) {
        throw AppError.badRequest(`Insufficient stock for product ${product.name}.`);
      }
    }

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
      await Transaction.create({
        productId: item.product,
        type: 'OUT',
        quantity: item.quantity,
        reference: `Order ${order._id}`,
      });
    }

    const customerObj = await Customer.findById(order.customer);
    if (customerObj) {
      customerObj.ordersCount += 1;
      customerObj.totalSpent += order.total;
      await customerObj.save();
    }
    await invalidateCache('products');
  }

  order.status = status;
  await order.save();

  logger.info('Order status updated', { orderId: order._id, status });
  sendSuccess(res, 200, 'Order status updated successfully', order);
});

exports.deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw AppError.notFound('Order');
  if (order.status === 'Completed') {
    throw AppError.badRequest('Cannot delete a completed order. Revert transactions first.');
  }
  await order.deleteOne();
  logger.info('Order deleted', { orderId: req.params.id });
  sendSuccess(res, 200, 'Order deleted successfully');
});
