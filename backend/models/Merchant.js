const mongoose = require('mongoose');

const MerchantSchema = new mongoose.Schema({
  // Identity
  surveyDate:   { type: String, default: () => new Date().toISOString().slice(0,10) },
  staffName:    { type: String, default: '' },
  merchantName: { type: String, required: true },
  mobileNo:     { type: String, required: true },
  shopName:     { type: String, default: '' },
  businessType: { type: String, default: '' },
  area:         { type: String, default: '' },

  // Gas
  gasCylindersPerMonth: { type: Number, default: 0 },
  gasBrand:             { type: String, default: '' },
  gasPricePerCylinder:  { type: Number, default: 0 },
  gasDelivery:          { type: String, default: 'Free' },

  // Food products — each has qty + pricePerUnit
  // Monthly products
  riceQty:          { type: Number, default: 0 },
  ricePrice:        { type: Number, default: 0 },
  whiteRiceQty:     { type: Number, default: 0 },
  whiteRicePrice:   { type: Number, default: 0 },
  potatoQty:        { type: Number, default: 0 },
  potatoPrice:      { type: Number, default: 0 },
  onionQty:         { type: Number, default: 0 },
  onionPrice:       { type: Number, default: 0 },
  palmOilQty:       { type: Number, default: 0 },
  palmOilPrice:     { type: Number, default: 0 },
  flourQty:         { type: Number, default: 0 },  // packs/month
  flourPrice:       { type: Number, default: 0 },  // per pack
  dalQty:           { type: Number, default: 0 },
  dalPrice:         { type: Number, default: 0 },
  sugarQty:         { type: Number, default: 0 },
  sugarPrice:       { type: Number, default: 0 },
  spicesQty:        { type: Number, default: 0 },
  spicesPrice:      { type: Number, default: 0 },
  teaLeavesQty:     { type: Number, default: 0 },
  teaLeavesPrice:   { type: Number, default: 0 },
  garlicGingerQty:  { type: Number, default: 0 },
  garlicGingerPrice:{ type: Number, default: 0 },
  greenChiliQty:    { type: Number, default: 0 },
  greenChiliPrice:  { type: Number, default: 0 },

  // Daily products (stored as per-day, multiplied by 30 for monthly)
  oilQtyPerDay:     { type: Number, default: 0 },
  oilPrice:         { type: Number, default: 0 },
  chickenQtyPerDay: { type: Number, default: 0 },
  chickenPrice:     { type: Number, default: 0 },
  eggsQtyPerDay:    { type: Number, default: 0 },  // cages
  eggsPrice:        { type: Number, default: 0 },  // per cage
  beefQtyPerDay:    { type: Number, default: 0 },
  beefPrice:        { type: Number, default: 0 },
  muttonQtyPerDay:  { type: Number, default: 0 },
  muttonPrice:      { type: Number, default: 0 },

  // Lead
  interestedInCityBest: { type: String, default: 'Maybe' }, // Yes / Maybe / No
  productsInterested:   { type: String, default: '' },
  followUpStatus:       { type: String, default: 'New' },   // New / Contacted / Converted / Lost
  followUpDate:         { type: String, default: '' },
  notes:                { type: String, default: '' },

}, { timestamps: true });

// Virtual: gas total spend/month
MerchantSchema.virtual('gasTotal').get(function() {
  return this.gasCylindersPerMonth * this.gasPricePerCylinder;
});

module.exports = mongoose.model('Merchant', MerchantSchema);
