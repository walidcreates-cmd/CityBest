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
app.use('/api/liverate', require('./routes/liverate'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/admin',    verifyAdmin, require('./routes/admin'));

// ── Health check ───────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'CityBest API running', version: '1.1.0', city: 'Sirajganj, Bangladesh' });
});

// ── Connect DB & Start ─────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => console.log(`✅ CityBest API running on port ${PORT}`));
  })
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });