'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const {
    createTip,
    getAllTips,
    getTipById,
    getTipsByCategory,
    getPersonalizedTips,
    updateTip,
    deleteTip,
    importDietTips,
    importWorkoutTips,
    importMentalTips
} = require('../controllers/tipController');

router.post('/import/diet', authenticate, authorizeRoles('admin'), importDietTips);
router.post('/import/workout', authenticate, authorizeRoles('admin'), importWorkoutTips);
router.post('/import/mental', authenticate, authorizeRoles('admin'), importMentalTips);

router.post('/', authenticate, authorizeRoles('admin'), createTip);
router.get('/', authenticate, getAllTips);
router.get('/category/:category', authenticate, getTipsByCategory);
router.get('/student/:studentId', authenticate, getPersonalizedTips);
router.get('/:id', authenticate, getTipById);
router.put('/:id', authenticate, authorizeRoles('admin'), updateTip);
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteTip);

module.exports = router;
