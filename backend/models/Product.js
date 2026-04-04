const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  emoji:    { type: String, default: '📦' },
  name:     { type: String, required: true },       // Bengali name
  nameEn:   { type: String, default: '' },           // English name
  price:    { type: Number, required: true },
  unit:     { type: String, default: 'প্রতিটি' },
  category: { type: String, default: 'other' },
  isFast:   { type: Boolean, default: false },
  stock:    { type: String, enum: ['ok', 'low', 'out'], default: 'ok' },
  rating:   { type: Number, default: 4.5 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
