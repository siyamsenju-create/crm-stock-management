const express = require('express');
const { addTransaction, getTransactions } = require('../controllers/transaction.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const paginate = require('../middlewares/paginate.middleware');
const transactionSchemas = require('../validations/transaction.validation');

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Stock movement (IN/OUT) tracking
 */

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Record a stock movement (IN or OUT)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, type, quantity]
 *             properties:
 *               productId:
 *                 type: string
 *                 description: MongoDB ObjectId of the product
 *               type:
 *                 type: string
 *                 enum: [IN, OUT]
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               reference:
 *                 type: string
 *                 description: Optional note / reference number
 *     responses:
 *       201:
 *         description: Transaction recorded
 *       400:
 *         description: Validation error or insufficient stock
 *       404:
 *         description: Product not found
 *   get:
 *     summary: Get transaction history with filtering & pagination
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: product
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [IN, OUT] }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Transactions list
 */
router.route('/')
  .post(authorize('Admin', 'Manager'), validate(transactionSchemas.create), addTransaction)
  .get(validate(transactionSchemas.list), paginate, getTransactions);

module.exports = router;
