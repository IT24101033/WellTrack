'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');

const { getSubscription, updateSubscription, cancelSubscription, createPaymentIntent } = require('../controllers/subscriptionController');
const { getPreferences, updatePreferences } = require('../controllers/preferenceController');
const upload = require('../middlewares/uploadMiddleware');

router.use(authenticate);

// Subscription
router.get('/subscription', getSubscription);
router.put('/subscription', upload.single('receipt'), updateSubscription);
router.delete('/subscription', cancelSubscription);
router.post('/subscription/create-payment-intent', createPaymentIntent);
router.post('/subscription/send-otp', require('../controllers/subscriptionController').sendPaymentOTP);
router.post('/subscription/verify-otp', require('../controllers/subscriptionController').verifyPaymentOTP);

// Preferences
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

module.exports = router;
