'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');

const { getSubscription, updateSubscription, cancelSubscription } = require('../controllers/subscriptionController');
const { getPreferences, updatePreferences } = require('../controllers/preferenceController');

router.use(authenticate);

// Subscription
router.get('/subscription', getSubscription);
router.put('/subscription', updateSubscription);
router.delete('/subscription', cancelSubscription);

// Preferences
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

module.exports = router;
