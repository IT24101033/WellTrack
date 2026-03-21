'use strict';

/**
 * routes/activityRoutes.js
 * All routes protected by JWT authentication.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const {
    createActivity,
    getActivities,
    getActivity,
    updateActivity,
    patchStatus,
    deleteActivity,
} = require('../controllers/activityController');

// All routes require authentication
router.use(authenticate);

router.post('/', createActivity);
router.get('/', getActivities);
router.get('/:id', getActivity);
router.put('/:id', updateActivity);
router.patch('/:id/status', patchStatus);
router.delete('/:id', deleteActivity);

module.exports = router;
