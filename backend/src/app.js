require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const path = require('path');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userSettingsRoutes = require('./routes/userSettingsRoutes');
const activityRoutes = require('./routes/activityRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const healthRoutes = require('./routes/healthRoutes');
const wellnessRoutes = require('./routes/wellnessRoutes');
const tipRoutes = require('./routes/tipRoutes');
const aiRoutes = require('./routes/aiRoutes');
const googleFitRoutes = require('./routes/googleFitRoutes');
const adminRoutes = require('./routes/adminRoutes');
const predictionRoutes = require('./routes/predictionRoutes');

const { authenticate } = require('./middlewares/authMiddleware');
const { getDashboard } = require('./controllers/reportController');

const app = express();

// ── Security Headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin "${origin}" not allowed.`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// ── Logger ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
}));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
    res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() })
);

// ── Static: Profile image uploads ────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/health', healthRoutes);
app.use('/api', userSettingsRoutes);   // /api/subscription + /api/preferences
app.get('/api/dashboard/:userId', authenticate, getDashboard);
app.use('/api/wellness', wellnessRoutes); // Food & Lifestyle Tips Management
app.use('/api/tips', tipRoutes); // Lifestyle Tips 
app.use('/api/ai', aiRoutes);
app.use('/api/google-fit', googleFitRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/predict', predictionRoutes);   // XGBoost ML service proxy

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) =>
    res.status(404).json({ success: false, message: 'Endpoint not found.' })
);

// ── Global Error Handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    console.error('[GlobalErrorHandler]', err);
    
    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        const msg = Object.values(err.errors).map(e => e.message).join(', ');
        return res.status(400).json({ success: false, message: msg });
    }
    
    // Mongoose Duplicate Key Error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({ success: false, message: `An entry with that ${field} already exists.` });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error.',
    });
});

// Initialize Cron Jobs
const { initCronJobs } = require('./utils/cronJobs');
initCronJobs();

module.exports = app;
