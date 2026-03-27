require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/admin',    require('./routes/admin'));

// ── Health check ───────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status:  '✅ CityBest API running',
    version: '1.0.0',
    city:    'Sirajganj, Bangladesh',
  });
});

// ── Connect DB & Start ─────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅  MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅  CityBest API running at http://localhost:${PORT}`);
      console.log(`    DB: MongoDB Atlas`);
    });
  })
  .catch(err => {
    console.error('❌  MongoDB error:', err.message);
    process.exit(1);
  });
