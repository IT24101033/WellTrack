'use strict';

const express = require('express');
const router = express.Router();
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');

const {
    createNotification,
    broadcastNotification,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    testFeature,
} = require('../controllers/notificationController');

// All routes require authentication
router.use(authenticate);

router.post('/', authorizeAdmin, createNotification);   // admin only
router.post('/broadcast', authorizeAdmin, broadcastNotification); // admin broadcast
router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);      // ⚠️ must be before /:id
router.delete('/all', clearAllNotifications); // ⚠️ must be before /:id
router.put('/:id', markAsRead);
router.delete('/:id', deleteNotification);

// Test feature
router.post('/test-feature', testFeature);

module.exports = router;
