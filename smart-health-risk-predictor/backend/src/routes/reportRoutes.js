'use strict';

/**
 * routes/reportRoutes.js
 *
 * IMPORTANT: /filter must be registered BEFORE /:id to prevent
 * Express treating the literal "filter" string as a dynamic :id param.
 *
 * Auth:  All routes require a valid JWT  (authenticate)
 * Admin: DELETE /:id additionally requires admin role (authorizeAdmin)
 */

const express = require('express');
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

// All routes require authentication
router.use(authenticate);

// ── Reports ───────────────────────────────────────────────────────────────────
router.post('/', createReport);    // POST   /api/reports
router.get('/filter', filterReports);   // GET    /api/reports/filter  ← MUST be before /:id
router.get('/user/:userId', getUserReports); // GET    /api/reports/user/:userId
router.get('/:id', getReportById);   // GET    /api/reports/:id
router.put('/:id', updateReport);    // PUT    /api/reports/:id
router.delete('/:id', authorizeAdmin, deleteReport); // DELETE /api/reports/:id (admin only)

module.exports = router;
