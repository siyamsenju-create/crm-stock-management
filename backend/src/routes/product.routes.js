const express = require('express');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getLowStockAlerts
} = require('../controllers/product.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/alerts/low-stock', getLowStockAlerts);

router.route('/')
  .get(getProducts)
  .post(authorize('Admin', 'Manager'), createProduct);

router.route('/:id')
  .get(getProductById)
  .put(authorize('Admin', 'Manager'), updateProduct)
  .delete(authorize('Admin'), deleteProduct);

module.exports = router;
