const express = require('express');
const router  = express.Router();
const Product = require('../models/Product');

router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = { isAvailable: true };
    if (category && category !== 'all') query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };
    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/seed', async (req, res) => {
  try {
    await Product.deleteMany({});
    const products = await Product.insertMany([
      { name: 'Gas Cylinder', nameBn: 'সিলিন্ডার গ্যাস', price: 1250, unit: '12 kg cylinder', emoji: '🔵', category: 'gas', stock: 20, isFast: true, isAvailable: true },
      { name: 'Miniket Rice', nameBn: 'মিনিকেট চাল', price: 75, unit: 'per kg', emoji: '🍚', category: 'rice', stock: 200, isFast: true, isAvailable: true },
      { name: 'Nazirshail Rice', nameBn: 'নাজিরশাইল চাল', price: 85, unit: 'per kg', emoji: '🍚', category: 'rice', stock: 150, isFast: false, isAvailable: true },
      { name: 'Potato', nameBn: 'আলু', price: 40, unit: 'per kg', emoji: '🥔', category: 'vegetables', stock: 100, isFast: true, isAvailable: true },
      { name: 'Onion', nameBn: 'পেঁয়াজ', price: 80, unit: 'per kg', emoji: '🧅', category: 'vegetables', stock: 80, isFast: true, isAvailable: true },
      { name: 'Hilsa Fish', nameBn: 'ইলিশ মাছ', price: 900, unit: 'per kg', emoji: '🐟', category: 'fish', stock: 15, isFast: false, isAvailable: true },
      { name: 'Milk', nameBn: 'দুধ', price: 70, unit: 'per litre', emoji: '🥛', category: 'dairy', stock: 50, isFast: true, isAvailable: true },
    ]);
    res.json({ success: true, message: `✅ ${products.length} products added!`, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
