const express = require('express');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getLowStockAlerts,
} = require('../controllers/product.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const paginate = require('../middlewares/paginate.middleware');
const productSchemas = require('../validations/product.validation');
const { cacheMiddleware } = require('../utils/cache');

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product (Inventory) Management
 */

/**
 * @swagger
 * /products/alerts/low-stock:
 *   get:
 *     summary: Get products with stock at or below their low-stock threshold
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Low stock products list
 */
router.get('/alerts/low-stock', cacheMiddleware('products', 30), getLowStockAlerts);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products with pagination, filtering & sorting
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sort
 *         schema: { type: string }
 *         description: Comma-separated fields, prefix with - for descending (e.g. -price,name)
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Products list
 *   post:
 *     summary: Create a new product (Admin/Manager only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.route('/')
  .get(validate(productSchemas.list), paginate, cacheMiddleware('products', 60), getProducts)
  .post(authorize('Admin', 'Manager'), validate(productSchemas.create), createProduct);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a single product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product found
 *       404:
 *         description: Product not found
 *   put:
 *     summary: Update product details (Admin/Manager only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         description: Product not found
 *   delete:
 *     summary: Delete a product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product deleted
 */
router.route('/:id')
  .get(validate(productSchemas.getById), cacheMiddleware('products', 120), getProductById)
  .put(authorize('Admin', 'Manager'), validate(productSchemas.update), updateProduct)
  .delete(authorize('Admin'), validate(productSchemas.deleteById), deleteProduct);

module.exports = router;
