'use strict';

/**
 * routes/reportRoutes.js
 *
 * IMPORTANT: Static paths (/filter, /import-health-pdf) must be registered
 * BEFORE /:id to prevent Express treating them as a dynamic :id param.
 *
 * Auth:  All routes require a valid JWT  (authenticate)
 * Admin: DELETE /:id additionally requires admin role (authorizeAdmin)
 */

const express = require('express');
const multer = require('multer');
const router = express.Router();

const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const {
    createReport,
    getUserReports,
    getReportById,
    updateReport,
    deleteReport,
    getDashboard,
    filterReports,
} = require('../controllers/reportController');
const { importHealthPdf } = require('../controllers/pdfImportController');

// ── Multer: memory storage — no files written to disk ─────────────────────────
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB hard cap at transport layer
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf') return cb(null, true);
        cb(new Error('Only PDF files are accepted.'), false);
    },
});

// All routes require authentication
router.use(authenticate);

// ── PDF Import ─────────────────────────────────────────────────────────────────
// POST /api/reports/import-health-pdf  ← MUST be before /:id
router.post('/import-health-pdf', upload.single('file'), importHealthPdf);

// ── Reports ───────────────────────────────────────────────────────────────────
router.post('/', createReport);
router.get('/filter', filterReports);          // MUST be before /:id
router.get('/user/:userId', getUserReports);
router.get('/:id', getReportById);
router.put('/:id', updateReport);
router.delete('/:id', authorizeAdmin, deleteReport);

module.exports = router;
