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
    deleteTip
} = require('../controllers/tipController');

router.post('/', authenticate, authorizeRoles('admin'), createTip);
router.get('/', authenticate, getAllTips);
router.get('/category/:category', authenticate, getTipsByCategory);
router.get('/student/:studentId', authenticate, getPersonalizedTips);
router.get('/:id', authenticate, getTipById);
router.put('/:id', authenticate, authorizeRoles('admin'), updateTip);
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteTip);

module.exports = router;
