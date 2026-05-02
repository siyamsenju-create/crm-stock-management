const express = require('express');
const { getDashboardAnalytics } = require('../controllers/analytics.controller');
const { protect } = require('../middlewares/auth.middleware');
const { cacheMiddleware } = require('../utils/cache');

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Dashboard statistics and insights
 */

/**
 * @swagger
 * /analytics:
 *   get:
 *     summary: Get dashboard analytics (totals, low stock, transaction stats)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProducts:
 *                       type: integer
 *                     lowStockItems:
 *                       type: integer
 *                     totalInventoryValue:
 *                       type: number
 *                     totalStockQuantity:
 *                       type: integer
 *                     totalStockInflow:
 *                       type: integer
 *                     totalStockOutflow:
 *                       type: integer
 *                     netInventoryMovement:
 *                       type: integer
 */
router.get('/', cacheMiddleware('analytics', 120), getDashboardAnalytics);

module.exports = router;
