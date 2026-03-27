const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');

// POST — place a new order
router.post('/', async (req, res) => {
  try {
    const {
      area, houseNo, roadNo,
      items, subtotal, deliveryFee, total,
      paymentMethod, transactionId,
      customerName, customerPhone, notes,
    } = req.body;

    // Basic validation
    if (!area)          return res.status(400).json({ success: false, message: 'Delivery area is required' });
    if (!items?.length) return res.status(400).json({ success: false, message: 'No items in order' });
    if (!paymentMethod) return res.status(400).json({ success: false, message: 'Payment method is required' });

    const order = await Order.create({
      area, houseNo, roadNo,
      items, subtotal,
      deliveryFee: deliveryFee || 30,
      total,
      paymentMethod,
      transactionId: transactionId || null,
      customerName:  customerName  || null,
      customerPhone: customerPhone || null,
      notes:         notes         || null,
      status: 'confirmed',
    });

    res.status(201).json({
      success: true,
      message: '✅ Order placed successfully!',
      data: order,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET — all orders (for admin)
router.get('/', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const query = {};
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, data: orders, total: orders.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET — single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH — update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending','confirmed','preparing','out_for_delivery','delivered','cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    res.json({ success: true, message: `Order updated to ${status}`, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
