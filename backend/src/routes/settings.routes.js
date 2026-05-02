const express = require('express');
const { factoryReset } = require('../controllers/settings.controller');
const router = express.Router();

router.post('/factory-reset', factoryReset);

module.exports = router;
