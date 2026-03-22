'use strict';

const express = require('express');
const router = express.Router();
const { syncData } = require('../controllers/googleFitController');
const { authenticate } = require('../middlewares/authMiddleware');

/**
 * Google Fit Routes
 * Note: Authentication (OAuth2) is currently handled on the frontend via Implicit Flow.
 * These routes handle syncing the pulled data to the backend database.
 */

router.post('/sync', authenticate, syncData);

module.exports = router;
