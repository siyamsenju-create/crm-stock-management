const express = require('express');
const { factoryReset } = require('../controllers/settings.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// Factory reset requires authentication AND Admin role
router.post('/factory-reset', protect, authorize('Admin'), factoryReset);

module.exports = router;
