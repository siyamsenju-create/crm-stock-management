const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a product name'],
    trim: true,
    index: true,
  },
  price: {
    type: Number,
    required: [true, 'Please provide a product price'],
    min: [0, 'Price cannot be negative'],
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide product quantity'],
    min: [0, 'Quantity cannot be negative'],
  },
  category: {
    type: String,
    required: [true, 'Please provide a product category'],
    index: true,
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);
