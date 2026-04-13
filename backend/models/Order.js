const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: String },
  name:      { type: String, required: true },
  price:     { type: Number, required: true },
  qty:       { type: Number, required: true },
  nameBn:    { type: String },
  emoji:     { type: String },
  image:     { type: String },
  unit:      { type: String },
  variantName: { type: String },
});

const orderSchema = new mongoose.Schema({
  uid:             { type: String, default: 'guest' },
  phone:           { type: String, default: '' },
  customerName:    { type: String, default: '' },
  deliveryAddress: { type: String, default: '' },
  address:         { type: String, default: '' },
  paymentMethod:   { type: String, default: 'cod' },
  items:           [orderItemSchema],
  total:           { type: Number, required: true },
  totalAmount:     { type: Number },
  subtotal:        { type: Number },
  deliveryFee:     { type: Number },
  notes:           { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending','confirmed','out_for_delivery','delivered','cancelled'],
    default: 'pending'
  },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);