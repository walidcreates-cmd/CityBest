const express = require('express');
const router = express.Router();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

async function sendPush(title, body, orderId = null) {
  try {
    const payload = {
      chat_id: TELEGRAM_CHAT_ID,
      text: body,
      parse_mode: 'HTML',
    };

    // If orderId provided, add inline "Deliver" button
    if (orderId) {
      payload.reply_markup = {
        inline_keyboard: [[
          {
            text: 'ডেলিভার করুন',
            callback_data: `deliver:${orderId}`,
          }
        ]]
      };
    }

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.log('Telegram error:', e.message);
  }
}

router.post('/subscribe', (req, res) => res.json({ ok: true }));

module.exports = { router, sendPush };