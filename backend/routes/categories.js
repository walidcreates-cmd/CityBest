const express  = require('express');
const router   = express.Router();
const Category = require('../models/Category');

const DEFAULTS = [
  { id:'gas',   label:'গ্যাস',  emoji:'🔵', bg:'#eff6ff', accent:'#2563eb', visible:true, order:1 },
  { id:'rice',  label:'চাল',    emoji:'🍚', bg:'#fefce8', accent:'#ca8a04', visible:true, order:2 },
  { id:'oil',   label:'তেল',    emoji:'🫙', bg:'#fff7ed', accent:'#ea580c', visible:true, order:3 },
  { id:'veg',   label:'সবজি',   emoji:'🥦', bg:'#f0fdf4', accent:'#15803d', visible:true, order:4 },
  { id:'fish',  label:'মাছ',    emoji:'🐟', bg:'#f0f9ff', accent:'#0284c7', visible:true, order:5 },
  { id:'spice', label:'মশলা',   emoji:'🌶️', bg:'#fff1f2', accent:'#e11d48', visible:true, order:6 },
];

// Seed defaults if DB is empty
async function seedIfEmpty() {
  const count = await Category.countDocuments();
  if (count === 0) {
    await Category.insertMany(DEFAULTS);
    console.log('✅ Categories seeded');
  }
}
seedIfEmpty();

// ── GET /api/categories — public, returns visible categories ────────────────
router.get('/', async (req, res) => {
  try {
    const cats = await Category.find({ visible:true }).sort({ order:1 });
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/categories/all — admin, returns all including hidden ────────────
router.get('/all', async (req, res) => {
  try {
    const cats = await Category.find().sort({ order:1 });
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/categories/:id — admin, update a category ─────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { label, emoji, image, bg, accent, visible, order } = req.body;
    const cat = await Category.findOneAndUpdate(
      { id: req.params.id },
      { $set: { label, emoji, image, bg, accent, visible, order } },
      { new:true, upsert:true }
    );
    res.json(cat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
