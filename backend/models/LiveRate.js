const mongoose = require('mongoose');

const liveRateSchema = new mongoose.Schema({
  type: { type: String, required: true }, // 'cylinder' or 'rice'
  id: { type: String, required: true },   // 'omera', 'bashundhara', etc.
  name: { type: String, required: true },
  price: { type: Number, required: true },
  unit: { type: String, required: true },
  img: { type: String, default: '' },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('LiveRate', liveRateSchema);