const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Customer info
  customerName:  { type: String },
  customerPhone: { type: String },

  // Delivery address
  area:    { type: String, required: true },
  houseNo: { type: String },
  roadNo:  { type: String },

  // Items ordered
  items: [{
    productId: String,
    name:      String,
    nameBn:    String,
    emoji:     String,
    price:     Number,
    qty:       Number,
    unit:        String,
  image:       String,
  variantName: String,
  }],

  // Pricing
  subtotal:    { type: Number, required: true },
  deliveryFee: { type: Number, default: 30 },
  total:       { type: Number, required: true },

  // Payment
  paymentMethod: {
    type: String,
    enum: ['bKash', 'Nagad', 'Rocket', 'Upay', 'Other Bank App', 'Cash on Delivery'],
    required: true,
  },
  transactionId: { type: String },

  // Order status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending',
  },

  // Rider assignment (for later)
  riderId:   { type: String },
  riderName: { type: String },

  // Notes
  notes: { type: String },

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
