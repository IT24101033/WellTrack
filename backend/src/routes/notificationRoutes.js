'use strict';

const express = require('express');
const router = express.Router();
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');

const {
    createNotification,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
} = require('../controllers/notificationController');

// All routes require authentication
router.use(authenticate);

router.post('/', authorizeAdmin, createNotification);   // admin only
router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);      // ⚠️ must be before /:id
router.delete('/all', clearAllNotifications); // ⚠️ must be before /:id
router.put('/:id', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
