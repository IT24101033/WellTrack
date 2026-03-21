'use strict';

const express = require('express');
const router = express.Router();
const { generateInsightForTip } = require('../controllers/aiController');
const { authenticate } = require('../middlewares/authMiddleware');

router.post('/tips/:id/generate-insight', authenticate, generateInsightForTip);

module.exports = router;
