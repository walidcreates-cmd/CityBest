const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name:   { type: String, default: '' },
  nameBn: { type: String, default: '' },
  price:  { type: Number, default: 0 },
  image:  { type: String, default: '' },
  emoji:  { type: String, default: '' },
}, { _id: false });

const productSchema = new mongoose.Schema({
  emoji:       { type: String, default: '📦' },
  name:        { type: String, required: true },   // English name
  nameBn:      { type: String, default: '' },       // Bengali name
  price:       { type: Number, required: true },
  unit:        { type: String, default: '' },
  category:    { type: String, default: 'other' },
  isFast:      { type: Boolean, default: false },
  stock:       { type: Number, default: 0 },        // numeric quantity
  image:       { type: String, default: '' },
  variants:    { type: [variantSchema], default: [] },
  isAvailable: { type: Boolean, default: true },    // used by admin dashboard
  isActive:    { type: Boolean, default: true },    // used by public GET filter
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
