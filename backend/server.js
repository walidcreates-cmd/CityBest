require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const admin      = require('firebase-admin');

const app = express();

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

app.use(cors());
app.use(express.json());

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function verifySurvey(req, res, next) {
  const token = req.headers['x-survey-token'];
  if (token === '1') return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

app.post('/api/survey/auth', (req, res) => {
  const { password } = req.body;
  const correct = process.env.SURVEY_PASSWORD;
  if (!correct) return res.status(500).json({ error: 'SURVEY_PASSWORD not set on Render' });
  if (password === correct) res.json({ success: true });
  else res.status(401).json({ error: 'Wrong password' });
});

app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   verifyToken,  require('./routes/orders'));
app.use('/api/admin',    verifyToken,  require('./routes/admin'));
app.use('/api/finance',  verifyToken,  require('./routes/finance'));

app.use('/api/survey',   verifySurvey, require('./routes/survey'));

app.get('/', (req, res) => res.json({ status: '✅ CityBest API running', version: '1.2.0' }));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT || 5000, () =>
      console.log('✅ CityBest API running on port ' + (process.env.PORT || 5000)));
  })
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });