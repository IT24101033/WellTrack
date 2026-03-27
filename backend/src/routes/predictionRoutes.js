'use strict';

/**
 * routes/predictionRoutes.js
 *
 * POST /api/predict          — run ML prediction (uses latest health entry)
 * GET  /api/predict/status   — check if Python ML service is online
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { predictRisk, mlServiceStatus } = require('../controllers/predictionController');

router.use(authenticate);

router.get('/status', mlServiceStatus);   // GET  /api/predict/status
router.post('/', predictRisk);            // POST /api/predict

module.exports = router;
