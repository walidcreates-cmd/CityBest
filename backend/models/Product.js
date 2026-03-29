const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  nameBn:  { type: String, default: '' },
  price:   { type: Number, required: true },
  image:   { type: String, default: '' },
  emoji:   { type: String, default: '' },
}, { _id: true });

const productSchema = new mongoose.Schema({
  emoji:       { type: String, default: '📦' },
  name:        { type: String, required: true },
  nameBn:      { type: String, default: '' },
  price:       { type: Number, required: true },
  unit:        { type: String, default: '' },
  category:    { type: String, default: 'all' },
  isFast:      { type: Boolean, default: false },
  stock:       { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true },
  image:       { type: String, default: '' },
  variants:    { type: [variantSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
