const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Please provide a product ID'],
  },
  type: {
    type: String,
    enum: {
      values: ['IN', 'OUT'],
      message: 'Transaction type must be either IN or OUT'
    },
    required: [true, 'Please provide transaction type (IN/OUT)'],
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide quantity'],
    min: [1, 'Quantity must be at least 1'],
  },
  reference: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Transaction', transactionSchema);
