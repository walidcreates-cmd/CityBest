const express = require('express');
const router  = express.Router();
const Order     = require('../models/Order');
const { sendPush } = require('./push');

router.post('/', async (req, res) => {
  try {
    const { items, total, totalAmount, deliveryAddress, address, phone, customerName, paymentMethod, notes, uid } = req.body;
    const finalTotal   = total || totalAmount;
    const finalAddress = deliveryAddress || address || '';
    const finalUid     = (req.user && req.user.uid) || uid || 'guest';
    if (!items || items.length === 0) return res.status(400).json({ error: 'No items in order' });
    if (!finalTotal) return res.status(400).json({ error: 'Total required' });
    const order = await Order.create({
      uid: finalUid, phone: phone || '', customerName: customerName || '',
      deliveryAddress: finalAddress, address: finalAddress,
      paymentMethod: paymentMethod || 'cod', items, total: finalTotal,
      totalAmount: finalTotal, notes: notes || '', status: 'pending',
    });
    const itemList = items.map(i => `  • ${i.name} × ${i.qty} = ৳${i.price * i.qty}`).join('\n');
const msg = `🛒 নতুন অর্ডার!\n\n👤 নাম: ${customerName || 'অজানা'}\n📞 ফোন: ${phone || 'নেই'}\n📍 ঠিকানা: ${finalAddress || 'নেই'}\n💳 পেমেন্ট: ${paymentMethod || 'cod'}\n\n🧺 পণ্য:\n${itemList}\n\n💰 মোট: ৳${finalTotal}${req.body.lat && req.body.lng ? `\n🗺️ লোকেশন: https://maps.google.com/?q=${req.body.lat},${req.body.lng}` : ''}`;
sendPush('🛒 নতুন অর্ডার!', msg);
res.status(201).json({ success: true, order });
  } catch (err) {
    console.error('POST /api/orders error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

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