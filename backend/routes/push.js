const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const mongoose = require('mongoose');

// Store subscriptions in MongoDB
const subSchema = new mongoose.Schema({ subscription: Object }, { timestamps: true });
const PushSub = mongoose.models.PushSub || mongoose.model('PushSub', subSchema);

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Save subscription from admin phone
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription } = req.body;
    await PushSub.deleteMany({}); // only keep latest
    await PushSub.create({ subscription });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Send push to all saved subscriptions
router.post('/send', async (req, res) => {
  try {
    const { title, body } = req.body;
    const subs = await PushSub.find();
    const payload = JSON.stringify({ title, body });
    await Promise.all(subs.map(s => webpush.sendNotification(s.subscription, payload)));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Export sendPush for use in orders.js
async function sendPush(title, body) {
  try {
    const subs = await PushSub.find();
    const payload = JSON.stringify({ title, body });
    await Promise.all(subs.map(s => webpush.sendNotification(s.subscription, payload)));
  } catch (e) {
    console.log('Push error:', e.message);
  }
}

module.exports = { router, sendPush };