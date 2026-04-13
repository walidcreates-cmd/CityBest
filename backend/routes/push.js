const express = require('express');
const router = express.Router();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendPush(title, body) {
  try {
    const text = `${title}\n${body}`;
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text })
    });
  } catch (e) {
    console.log('Telegram error:', e.message);
  }
}

router.post('/subscribe', (req, res) => res.json({ ok: true }));

module.exports = { router, sendPush };