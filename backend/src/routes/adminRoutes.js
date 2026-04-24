'use strict';

const express = require('express');
const router = express.Router();
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const { getSystemAnalytics } = require('../controllers/adminController');
const { getPendingSubscriptions, verifySubscription } = require('../controllers/subscriptionController');

router.use(authenticate, authorizeAdmin);

router.get('/analytics', getSystemAnalytics);

// Subscription Verification
router.get('/subscriptions/pending', getPendingSubscriptions);
router.patch('/subscriptions/:id/verify', verifySubscription);

module.exports = router;
