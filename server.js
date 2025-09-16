// --- Core ---
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// --- Firebase Admin ---
const admin = require('firebase-admin');

// --- ENV ---
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || '';
const ALLOWED_ADMIN_EMAIL = process.env.ALLOWED_ADMIN_EMAIL || '';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_PRIVATE_KEY = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

// --- App ---
const app = express();
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// CORS: можно перечислить несколько доменов через запятую
const allowedOrigins = CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);                 // healthchecks/curl
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true }));

// --- Mongo ---
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI, { autoIndex: true })
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => {
      console.error('❌ MongoDB connect error:', err.message);
      // Не валим процесс — пускай поднимется хотя бы API/healthz
    });
} else {
  console.warn('⚠️  MONGODB_URI not set — DB disabled');
}

// --- Firebase ---
if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY
    })
  });
  console.log('✅ Firebase Admin initialized');
} else {
  console.warn('⚠️  Firebase Admin env not complete — admin routes will reject');
}

// --- Middleware: verify admin ---
async function verifyAdmin(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    const decoded = await admin.auth().verifyIdToken(token);
    if (ALLOWED_ADMIN_EMAIL && decoded.email !== ALLOWED_ADMIN_EMAIL) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
}

// --- Health/Test ---
app.get('/healthz', (_req, res) => res.status(200).send('ok'));
app.get('/api/test', (_req, res) => res.json({ success: true, ts: new Date().toISOString() }));

// --- Safe stubs (временно, чтобы сервис запускался даже без твоих файлов) ---
function safeMount(path, fallbackRouter) {
  try {
    // если есть твой роут — подключим его
    const router = require(`.${path}`);
    app.use(`/api${path}`, router);
    console.log(`✅ Mounted route /api${path} (from file)`);
  } catch {
    // иначе поставим простой заглушечный роут
    app.use(`/api${path}`, fallbackRouter);
    console.log(`ℹ️  Mounted route /api${path} (stub)`);
  }
}

// Заглушки
const stub = msg => express.Router().get('/', (_r, res) => res.json({ ok: true, route: msg }));
const stubAdmin = express.Router().get('/ping', verifyAdmin, (_r, res) => res.json({ ok: true, who: 'admin' }));

// Публичные (если нет файлов, будут stubs)
safeMount('/channels', stub('channels'));
safeMount('/orders', stub('orders'));

// Админские — защищены Firebase ID Token
try {
  const adminRouter = require('./routes/admin');
  app.use('/api/admin', verifyAdmin, adminRouter);
  console.log('✅ Mounted /api/admin (from file)');
} catch {
  app.use('/api/admin', stubAdmin);
  console.log('ℹ️  Mounted /api/admin (stub, protected by verifyAdmin)');
}

// 404
app.use('*', (_req, res) => res.status(404).json({ success: false, message: 'Not found' }));

// Start
app.listen(PORT, () => console.log(`🚀 Listening on port ${PORT}`));
