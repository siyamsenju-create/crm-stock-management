const express = require('express');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} = require('../controllers/order.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const paginate = require('../middlewares/paginate.middleware');
const orderSchemas = require('../validations/order.validation');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(validate(orderSchemas.list), paginate, getOrders)
  .post(authorize('Admin', 'Manager'), validate(orderSchemas.create), createOrder);

router.route('/:id')
  .get(validate(orderSchemas.getById), getOrderById)
  .delete(authorize('Admin'), validate(orderSchemas.deleteById), deleteOrder);

router.route('/:id/status')
  .patch(authorize('Admin', 'Manager'), validate(orderSchemas.updateStatus), updateOrderStatus);

module.exports = router;
