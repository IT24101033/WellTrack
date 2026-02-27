'use strict';

const LifestyleTip = require('../models/lifestyleTipModel');

// POST /api/tips
const createTip = async (req, res, next) => {
    try {
        const { title, description, category, difficulty_level, recommended_time, target_type } = req.body;

        const newTip = await LifestyleTip.create({
            title,
            description,
            category,
            difficulty_level,
            recommended_time: recommended_time || null,
            target_type: target_type || 'GENERAL',
            created_by: req.user.id
        });

        res.status(201).json({ success: true, data: newTip });
    } catch (error) {
        next(error);
    }
};

// GET /api/tips
const getAllTips = async (req, res, next) => {
    try {
        const tips = await LifestyleTip.find({ is_active: true }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: tips });
    } catch (error) {
        next(error);
    }
};

// GET /api/tips/:id
const getTipById = async (req, res, next) => {
    try {
        const tip = await LifestyleTip.findOne({ _id: req.params.id, is_active: true });
        if (!tip) {
            return res.status(404).json({ success: false, message: 'Tip not found' });
        }
        res.status(200).json({ success: true, data: tip });
    } catch (error) {
        next(error);
    }
};

// GET /api/tips/category/:category
const getTipsByCategory = async (req, res, next) => {
    try {
        const { category } = req.params;
        const tips = await LifestyleTip.find({ category: category.toUpperCase(), is_active: true });
        res.status(200).json({ success: true, data: tips });
    } catch (error) {
        next(error);
    }
};

// GET /api/tips/student/:studentId
const getPersonalizedTips = async (req, res, next) => {
    try {
        // In a real scenario, fetch student data. For now, simulate personalization based on query params.
        // Assuming some recent health record data might be passed or fetched via studentId.
        // For demonstration, let's say we fetch it. We will try to load StudentHealth record.
        const StudentHealth = require('../models/studentHealthModel');
        const latestHealth = await StudentHealth.findOne({ userId: req.params.studentId }).sort({ assessmentDate: -1 });

        let targetTypes = ['GENERAL'];

        if (latestHealth) {
            if (latestHealth.sleepHours < 6) {
                targetTypes.push('SLEEP');
            }
            if (latestHealth.stressLevel === 'High' || latestHealth.stressLevel === 'Critical' || latestHealth.stressScore > 7) {
                targetTypes.push('STRESS');
            }
            if (latestHealth.physicalActivityLevel === 'Low' || latestHealth.physicalActivityScore < 4) {
                targetTypes.push('FITNESS');
            }
        } else {
            // Default targets if no health record
            targetTypes = ['GENERAL', 'SLEEP', 'STRESS', 'FITNESS'];
        }

        const tips = await LifestyleTip.find({
            is_active: true,
            target_type: { $in: targetTypes }
        }).limit(10);

        res.status(200).json({ success: true, data: tips });
    } catch (error) {
        console.error("Personalization error:", error);
        next(error);
    }
};

// PUT /api/tips/:id
const updateTip = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const tip = await LifestyleTip.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

        if (!tip) {
            return res.status(404).json({ success: false, message: 'Tip not found' });
        }

        res.status(200).json({ success: true, data: tip });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/tips/:id
const deleteTip = async (req, res, next) => {
    try {
        const tip = await LifestyleTip.findByIdAndUpdate(req.params.id, { is_active: false }, { new: true });
        if (!tip) {
            return res.status(404).json({ success: false, message: 'Tip not found' });
        }
        res.status(200).json({ success: true, message: 'Tip softly deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTip,
    getAllTips,
    getTipById,
    getTipsByCategory,
    getPersonalizedTips,
    updateTip,
    deleteTip
};
