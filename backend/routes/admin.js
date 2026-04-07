const express = require('express');
const router  = express.Router();
const Product = require('../models/Product');
const Order   = require('../models/Order');
const LiveRate = require('../models/LiveRate');

const ADMIN_UIDS = (process.env.ADMIN_UIDS || '').split(',').map(s => s.trim());

function requireAdmin(req, res, next) {
  if (!ADMIN_UIDS.includes(req.user.uid)) {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }
  next();
}

router.post('/products', requireAdmin, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/products/:id', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/products/:id', requireAdmin, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(200);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/seed', requireAdmin, async (req, res) => {
  const seedProducts = [
    { emoji:'🔵', name:'সিলিন্ডার গ্যাস', nameEn:'Gas Cylinder',    price:1250, unit:'12 কেজি',     category:'gas',   isFast:true,  stock:'low', rating:4.8 },
    { emoji:'🍚', name:'মিনিকেট চাল',     nameEn:'Miniket Rice',    price:75,   unit:'প্রতি কেজি',  category:'rice',  isFast:true,  stock:'ok',  rating:4.6 },
    { emoji:'🫙', name:'সয়াবিন তেল',     nameEn:'Soybean Oil',     price:165,  unit:'প্রতি লিটার', category:'oil',   isFast:false, stock:'ok',  rating:4.5 },
    { emoji:'🥦', name:'ফুলকপি',          nameEn:'Cauliflower',     price:35,   unit:'প্রতিটি',     category:'veg',   isFast:true,  stock:'ok',  rating:4.3 },
    { emoji:'🐟', name:'রুই মাছ',         nameEn:'Rohu Fish',       price:220,  unit:'প্রতি কেজি',  category:'fish',  isFast:false, stock:'ok',  rating:4.7 },
    { emoji:'🌶️', name:'মরিচ গুঁড়া',     nameEn:'Chili Powder',    price:180,  unit:'৫০০ গ্রাম',   category:'spice', isFast:false, stock:'ok',  rating:4.4 },
    { emoji:'🍚', name:'নাজিরশাইল চাল',   nameEn:'Nazirshail Rice', price:85,   unit:'প্রতি কেজি',  category:'rice',  isFast:false, stock:'ok',  rating:4.5 },
    { emoji:'🥦', name:'আলু',             nameEn:'Potato',          price:28,   unit:'প্রতি কেজি',  category:'veg',   isFast:true,  stock:'ok',  rating:4.2 },
  ];
  try {
    await Product.deleteMany({});
    const inserted = await Product.insertMany(seedProducts);
    res.json({ seeded: inserted.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/liverate', async (req, res) => {
  try {
    const rates = await LiveRate.find({ active: true }).sort({ type: 1, name: 1 });
    res.json(rates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/liverate/toggle', async (req, res) => {
  try {
    const { id } = req.body;
    const rate = await LiveRate.findOne({ id });
    const updated = await LiveRate.findOneAndUpdate(
      { id },
      { active: !rate.active },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/liverate/update', async (req, res) => {
  try {
    const { id, price, img } = req.body;
    const updateData = { price: Number(price) };
    if (img !== undefined) updateData.img = img;
    const updated = await LiveRate.findOneAndUpdate(
      { id },
      updateData,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;