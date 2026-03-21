'use strict';

const express = require('express');
const router = express.Router();
const { getAuthUrl, handleCallback, syncData } = require('../controllers/fitbitController');
const { authenticate } = require('../middlewares/authMiddleware');

router.get('/auth-url', authenticate, getAuthUrl);
router.get('/callback', handleCallback); // OAuth callback usually doesn't have Auth header
router.post('/sync', authenticate, syncData);

module.exports = router;
