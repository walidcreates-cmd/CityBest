const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');

// POST /api/orders — place a new order (protected)
router.post('/', async (req, res) => {
  try {
    const { items, total, deliveryAddress, phone, paymentMethod } = req.body;

    if (!items || items.length === 0) return res.status(400).json({ error: 'No items in order' });
    if (!deliveryAddress)             return res.status(400).json({ error: 'Delivery address required' });
    if (!phone)                       return res.status(400).json({ error: 'Phone required' });

    const order = await Order.create({
      uid: req.user.uid,
      phone,
      deliveryAddress,
      paymentMethod: paymentMethod || 'cod',
      items,
      total,
      status: 'pending',
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders — get current user's orders (protected)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({ uid: req.user.uid }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id — get single order (protected, own only)
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, uid: req.user.uid });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
