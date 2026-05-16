const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const { invalidateCache } = require('../utils/cache');
const logger = require('../utils/logger');

exports.createOrder = asyncHandler(async (req, res) => {
  const { customer, items, status } = req.body;

  const customerObj = await Customer.findById(customer);
  if (!customerObj) throw AppError.notFound('Customer');

  let total = 0;
  const processedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) throw AppError.notFound(`Product not found: ${item.product}`);
    
    if (status === 'Completed' && product.quantity < item.quantity) {
      throw AppError.badRequest(`Insufficient stock for product ${product.name}`);
    }

    processedItems.push({
      product: product._id,
      quantity: item.quantity,
      price: product.price,
    });
    total += product.price * item.quantity;
  }

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
        $inc: { quantity: -item.quantity }
      });
      await Transaction.create({
        productId: item.product,
        type: 'OUT',
        quantity: item.quantity,
        reference: `Order ${order._id}`
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
  const order = await Order.findById(req.params.id).populate('customer', 'name email').populate('items.product', 'name sku price');
  if (!order) throw AppError.notFound('Order');
  sendSuccess(res, 200, 'Order fetched successfully', order);
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw AppError.notFound('Order');

  if (order.status === 'Completed') {
    throw AppError.badRequest('Cannot change status of a completed order');
  }

  if (status === 'Completed') {
    // Process stock deduction
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product.quantity < item.quantity) {
        throw AppError.badRequest(`Insufficient stock for product ${product.name}`);
      }
    }

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
      await Transaction.create({
        productId: item.product,
        type: 'OUT',
        quantity: item.quantity,
        reference: `Order ${order._id}`
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
