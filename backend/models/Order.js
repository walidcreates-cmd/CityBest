const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');

// POST /api/orders — place a new order (works for both app users and liverate guests)
router.post('/', async (req, res) => {
  try {
    const {
      items, total, totalAmount,
      deliveryAddress, address,
      phone, customerName,
      paymentMethod, notes,
      uid,
    } = req.body;

    const finalTotal   = total || totalAmount;
    const finalAddress = deliveryAddress || address || '';
    const finalUid     = (req.user && req.user.uid) || uid || 'guest';
    const finalPhone   = phone || '';

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }
    if (!finalTotal) {
      return res.status(400).json({ error: 'Total required' });
    }

    const order = await Order.create({
      uid:             finalUid,
      phone:           finalPhone,
      customerName:    customerName || '',
      deliveryAddress: finalAddress,
      address:         finalAddress,
      paymentMethod:   paymentMethod || 'cod',
      items,
      total:           finalTotal,
      totalAmount:     finalTotal,
      notes:           notes || '',
      status:          'pending',
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error('POST /api/orders error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders — get current user's orders
router.get('/', async (req, res) => {
  try {
    const uid = req.user ? req.user.uid : null;
    if (!uid) return res.json([]);
    const orders = await Order.find({ uid }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;