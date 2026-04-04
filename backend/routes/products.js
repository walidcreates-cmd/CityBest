const express = require('express');
const router  = express.Router();
const Product = require('../models/Product');

// GET /api/products — public, returns all active products
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category && category !== 'all') filter.category = category;
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
