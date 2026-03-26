'use strict';

const express = require('express');
const router = express.Router();
const { generateInsightForTip, getHealthAdvice } = require('../controllers/aiController');
const { authenticate } = require('../middlewares/authMiddleware');

// Generate AI insight + YouTube link for a specific tip
router.post('/tips/:id/generate-insight', authenticate, generateInsightForTip);

// Generate personalized health advice (Gemini) + YouTube videos for the Tips page
router.post('/health-advice', authenticate, getHealthAdvice);

module.exports = router;
