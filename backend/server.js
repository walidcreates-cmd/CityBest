require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const admin    = require('firebase-admin');
const jwt      = require('jsonwebtoken');

const app = express();

// ── Firebase Admin Init ────────────────────────────────────────────────────
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch(e) {
  console.warn('Firebase Admin not initialized:', e.message);
}

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'citybest-admin-secret';

// ── verifyAdmin — checks JWT password-based token ─────────────────────────
function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ── verifyToken — checks Firebase token (for customer orders) ──────────────
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ── Public admin login ─────────────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const correct = process.env.ADMIN_PASSWORD || 'citybest2024';
  if (password !== correct) {
    return res.status(401).json({ success: false, message: 'Wrong password' });
  }
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token });
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/ai',       require('./routes/ai'));
app.use('/api/otp',      require('./routes/otp'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/liverate', require('./routes/liverate'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/admin',    verifyAdmin, require('./routes/admin'));
app.use('/api/push',     require('./routes/push').router);

// ── Health check ───────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'CityBest API running', version: '1.1.0', city: 'Sirajganj, Bangladesh' });
});

// ── Connect DB & Start ─────────────────────────────────────────────────────
// ── Telegram Webhook (Deliver button callback) ─────────────────────────────
const Order = require('./models/Order');

app.post('/api/telegram-webhook', async (req, res) => {
  try {
    const callback = req.body.callback_query;
    if (!callback) return res.sendStatus(200);

    const data       = callback.data; // e.g. "deliver:68001abc..."
    const messageId  = callback.message.message_id;
    const chatId     = callback.message.chat.id;
    const callbackId = callback.id;

    if (data.startsWith('deliver:')) {
      const orderId = data.split(':')[1];

      const order = await Order.findByIdAndUpdate(
        orderId,
        { status: 'delivered' },
        { new: true }
      );

      if (!order) {
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: callbackId, text: '❌ অর্ডার পাওয়া যায়নি!' }),
        });
        return res.sendStatus(200);
      }

      // Answer the callback (removes loading spinner)
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackId, text: '✅ ডেলিভার হয়েছে!' }),
      });

      // Edit the button to show "✔✔ ডেলিভারড"
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageReplyMarkup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [[
              { text: '✔✔ ডেলিভারড', callback_data: 'done' }
            ]]
          }
        }),
      });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Telegram webhook error:', err.message);
    res.sendStatus(200);
  }
});
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => console.log(`✅ CityBest API running on port ${PORT}`));
  })
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });