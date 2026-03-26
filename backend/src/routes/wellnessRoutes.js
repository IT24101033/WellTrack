'use strict';

/**
 * routes/wellnessRoutes.js
 *
 * Base path (mounted in app.js): /api/wellness
 *
 * Endpoint Summary
 * ────────────────────────────────────────────────────────────────────────────
 * POST   /api/wellness              → Admin: create a new tip
 * GET    /api/wellness              → Student+: list approved tips (paginated + filtered)
 * GET    /api/wellness/admin        → Admin: list ALL tips (any status)
 * GET    /api/wellness/:id          → Student+: get one approved tip
 * PUT    /api/wellness/:id          → Admin: update a tip
 * DELETE /api/wellness/:id          → Admin: delete a tip
 *
 * Query parameters for GET /api/wellness and GET /api/wellness/admin:
 *   category  — diet | workout | mental
 *   search    — keyword (full-text)
 *   page      — page number (default 1)
 *   limit     — results per page (default 10, max 100)
 *
 * Additional for GET /api/wellness/admin:
 *   status    — approved | pending
 */

const express = require('express');
const router = express.Router();

const { authenticate } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const {
    createTip,
    getApprovedTips,
    getAllTipsAdmin,
    getTipById,
    updateTip,
    deleteTip,
} = require('../controllers/wellnessController');

// ── Admin-only routes ─────────────────────────────────────────────────────────

// POST   /api/wellness         — Create a wellness tip
router.post(
    '/',
    authenticate,
    authorizeRoles('admin'),
    createTip
);

// GET    /api/wellness/admin   — List ALL tips (approved + pending)
// NOTE: This must be declared BEFORE /:id to avoid "admin" being treated as an ID
router.get(
    '/admin',
    authenticate,
    authorizeRoles('admin'),
    getAllTipsAdmin
);

// PUT    /api/wellness/:id     — Update a wellness tip
router.put(
    '/:id',
    authenticate,
    authorizeRoles('admin'),
    updateTip
);

// DELETE /api/wellness/:id     — Delete a wellness tip
router.delete(
    '/:id',
    authenticate,
    authorizeRoles('admin'),
    deleteTip
);

// ── Student (and admin) read routes ───────────────────────────────────────────

// GET    /api/wellness         — List approved tips (paginated, filtered, searchable)
router.get(
    '/',
    authenticate,
    authorizeRoles('admin', 'student'),
    getApprovedTips
);

// GET    /api/wellness/:id     — Get a single approved tip
router.get(
    '/:id',
    authenticate,
    authorizeRoles('admin', 'student'),
    getTipById
);

module.exports = router;
