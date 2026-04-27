const express = require('express');
const { getDashboardAnalytics } = require('../controllers/analytics.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);
router.get('/', getDashboardAnalytics);

module.exports = router;
