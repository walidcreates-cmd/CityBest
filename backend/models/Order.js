const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name:      { type: String, required: true },
  price:     { type: Number, required: true },
  qty:       { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  uid:             { type: String, required: true },   // Firebase UID
  phone:           { type: String, required: true },
  deliveryAddress: { type: String, required: true },
  paymentMethod:   { type: String, enum: ['cod', 'bkash', 'nagad'], default: 'cod' },
  items:           [orderItemSchema],
  total:           { type: Number, required: true },
  status:          { type: String, enum: ['pending', 'confirmed', 'delivered', 'cancelled'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
