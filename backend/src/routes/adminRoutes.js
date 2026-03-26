'use strict';

const express = require('express');
const router = express.Router();
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const { getSystemAnalytics } = require('../controllers/adminController');

router.use(authenticate, authorizeAdmin);

router.get('/analytics', getSystemAnalytics);

module.exports = router;
