'use strict';

/**
 * routes/reminderRoutes.js
 * All routes protected by JWT authentication.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const {
    getUserReminders,
    createReminder,
    deleteReminder,
    acknowledgeReminder,
} = require('../controllers/reminderController');

// All routes require authentication
router.use(authenticate);

router.get('/', getUserReminders);
router.post('/', createReminder);
router.patch('/:id/acknowledge', acknowledgeReminder);
router.delete('/:id', deleteReminder);

module.exports = router;
