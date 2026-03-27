const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  nameBn:      { type: String },
  description: { type: String },
  price:       { type: Number, required: true },
  unit:        { type: String, default: 'kg' },
  emoji:       { type: String, default: '🛒' },
  category:    { type: String, required: true },
  stock:       { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true },
  isFast:      { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
