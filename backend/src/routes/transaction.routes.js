const express = require('express');
const { addTransaction, getTransactions } = require('../controllers/transaction.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .post(addTransaction)
  .get(getTransactions);

module.exports = router;
