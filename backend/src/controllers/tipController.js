'use strict';

const LifestyleTip = require('../models/lifestyleTipModel');
const User = require('../models/User');
const { sendAppAlert } = require('../utils/notificationService');
const axios = require('axios');

/**
 * Helper function to silently broadcast an alert to all active students.
 */
const notifyAllStudents = async (title, message) => {
    try {
        const students = await User.find({ role: 'student', isActive: true }).select('_id');
        for (const student of students) {
            // Unawaited intentionally to prevent blocking the response
            sendAppAlert(student._id.toString(), title, message, 'wellness').catch(e => console.error(e));
        }
    } catch (err) {
        console.error("Error notifying students:", err);
    }
};

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

        // Broadcast to all students
        notifyAllStudents("New Health Tip Added! 🌱", `A new ${category.toLowerCase()} tip has been added: "${title}". Check your dashboard!`);

        res.status(201).json({ success: true, data: newTip });
    } catch (error) {
        next(error);
    }
};

// GET /api/tips
const getAllTips = async (req, res, next) => {
    try {
        const WellnessTip = require('../models/WellnessTip');
        const tips = await LifestyleTip.find({ is_active: true }).sort({ createdAt: -1 });
        const wellnessTips = await WellnessTip.find({ status: 'approved' }).sort({ createdAt: -1 });
        
        const normalizedWellness = wellnessTips.map(t => ({
            _id: t._id,
            title: t.title,
            description: t.description,
            category: t.category.toUpperCase(),
            recommended_time: t.time || '',
            difficulty_level: 'MEDIUM',
            target_type: 'GENERAL',
            is_active: true,
            createdAt: t.createdAt
        }));

        const combined = [...tips, ...normalizedWellness];
        combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json({ success: true, data: combined });
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
        const WellnessTip = require('../models/WellnessTip');
        const { category } = req.params;
        const lifestyleTips = await LifestyleTip.find({ category: category.toUpperCase(), is_active: true });
        const wellnessTips = await WellnessTip.find({ category: category.toLowerCase(), status: 'approved' });

        const normalizedWellness = wellnessTips.map(t => ({
            _id: t._id,
            title: t.title,
            description: t.description,
            category: t.category.toUpperCase(),
            recommended_time: t.time || '',
            difficulty_level: 'MEDIUM',
            target_type: 'GENERAL',
            is_active: true,
            createdAt: t.createdAt
        }));

        const combined = [...lifestyleTips, ...normalizedWellness];
        combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json({ success: true, data: combined });
    } catch (error) {
        next(error);
    }
};

// GET /api/tips/student/:studentId
const getPersonalizedTips = async (req, res, next) => {
    try {
        const StudentHealth = require('../models/studentHealthModel');
        const WellnessTip = require('../models/WellnessTip');
        const latestHealth = await StudentHealth.findOne({ userId: req.params.studentId }).sort({ assessmentDate: -1 });

        const targetTypes = ['GENERAL', 'SLEEP', 'STRESS', 'FITNESS'];
        
        // Fetch from LifestyleTip collection
        const lifestyleTips = await LifestyleTip.find({
            is_active: true,
            target_type: { $in: targetTypes }
        })
        .sort({ createdAt: -1 })
        .limit(30);

        // Fetch from WellnessTip collection (Admin additions)
        const wellnessTips = await WellnessTip.find({
            status: 'approved'
        }).sort({ createdAt: -1 }).limit(30);

        // Normalize wellness tips to lifestyle tips format for frontend compatibility
        const normalizedWellness = wellnessTips.map(t => ({
            _id: t._id,
            title: t.title,
            description: t.description,
            category: t.category.toUpperCase(),
            recommended_time: t.time || '',
            difficulty_level: 'MEDIUM',
            target_type: 'GENERAL',
            is_active: true,
            createdAt: t.createdAt
        }));

        // Tips the user added themselves
        const scheduledTips = await LifestyleTip.find({
            is_active: true,
            created_by: req.params.studentId
        }).sort({ createdAt: -1 });

        // Combine and de-duplicate by title (or original ID)
        const combined = [...lifestyleTips, ...normalizedWellness, ...scheduledTips];
        
        // Use title as a fallback key if needed, but _id is better
        const uniqueTips = Array.from(new Map(combined.map(item => [item.title, item])).values());

        // Sort by newest first
        uniqueTips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json({ success: true, data: uniqueTips });
    } catch (error) {
        console.error("Personalization error:", error);
        next(error);
    }
};

// POST /api/tips/schedule
const scheduleTip = async (req, res, next) => {
    try {
        const { title, description, category, target_type, difficulty_level, time } = req.body;
        
        const newTip = await LifestyleTip.create({
            title,
            description,
            category: category.toUpperCase(),
            difficulty_level: difficulty_level || 'EASY',
            recommended_time: time || '',
            target_type: target_type || 'GENERAL',
            created_by: req.user.id,
            source: 'EXTERNAL'
        });

        res.status(201).json({ success: true, data: newTip });
    } catch (error) {
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

// ================= EXTERNAL IMPORTS =================

// POST /api/tips/import/diet
const importDietTips = async (req, res, next) => {
    try {
        // TheMealDB search returns full details including instructions
        const response = await axios.get('https://www.themealdb.com/api/json/v1/1/search.php?s=chicken');
        const meals = response.data.meals || [];

        let importedCount = 0;

        for (const meal of meals) {
            // Prevent duplicates using external_id (idMeal)
            const existing = await LifestyleTip.findOne({ external_id: meal.idMeal, source: 'EXTERNAL' });
            if (!existing) {
                await LifestyleTip.create({
                    title: `Healthy Recipe: ${meal.strMeal}`,
                    description: meal.strInstructions || 'Healthy chicken recipe.',
                    category: 'DIET',
                    difficulty_level: 'MEDIUM',
                    target_type: 'GENERAL',
                    source: 'EXTERNAL',
                    external_id: meal.idMeal,
                    image_url: meal.strMealThumb,
                    // external tips don't have a required created_by
                });
                importedCount++;
            }
        }

        if (importedCount > 0) {
            notifyAllStudents("New Diet Recipes Available! 🥗", `${importedCount} delicious new healthy recipes have been imported. Head over to the health tips section!`);
        }

        res.status(200).json({ success: true, message: `Successfully imported ${importedCount} diet tips`, importedCount });
    } catch (error) {
        console.error("Error importing diet tips:", error.message);
        res.status(500).json({ success: false, message: 'Failed to import diet tips from external API' });
    }
};

// POST /api/tips/import/workout
const importWorkoutTips = async (req, res, next) => {
    try {
        const response = await axios.get('https://wger.de/api/v2/exercise/?language=2&limit=20');
        const exercises = response.data.results || [];

        let importedCount = 0;

        for (const exercise of exercises) {
            // WGER API returns HTML in description, we strip it
            const cleanDescription = exercise.description
                ? exercise.description.replace(/<[^>]*>?/gm, '')
                : 'Great workout exercise.';

            if (cleanDescription.trim() === '') continue;

            const existing = await LifestyleTip.findOne({ external_id: exercise.id.toString(), source: 'EXTERNAL' });
            if (!existing) {
                await LifestyleTip.create({
                    title: exercise.name || 'Workout Exercise',
                    description: cleanDescription,
                    category: 'WORKOUT',
                    difficulty_level: 'MEDIUM',
                    target_type: 'FITNESS',
                    source: 'EXTERNAL',
                    external_id: exercise.id.toString(),
                });
                importedCount++;
            }
        }

        if (importedCount > 0) {
            notifyAllStudents("New Workout Routines Added! 🏋️‍♂️", `${importedCount} brand new exercises have just been imported to help you stay fit!`);
        }

        res.status(200).json({ success: true, message: `Successfully imported ${importedCount} workout tips`, importedCount });
    } catch (error) {
        console.error("Error importing workout tips:", error.message);
        res.status(500).json({ success: false, message: 'Failed to import workout tips from external API' });
    }
};

// POST /api/tips/import/mental
const importMentalTips = async (req, res, next) => {
    try {
        // ZenQuotes random returns array of quotes
        const response = await axios.get('https://zenquotes.io/api/quotes'); // getting 50 random quotes
        const quotes = response.data || [];

        let importedCount = 0;

        for (const quote of quotes) {
            // Zenquotes lacks unique IDs, we can hash or use title/description as deduplication
            const existing = await LifestyleTip.findOne({ title: `Quote by ${quote.a}`, description: quote.q, source: 'EXTERNAL' });
            if (!existing) {
                await LifestyleTip.create({
                    title: `Quote by ${quote.a}`,
                    description: quote.q,
                    category: 'MENTAL',
                    difficulty_level: 'EASY',
                    target_type: 'STRESS',
                    source: 'EXTERNAL',
                    external_id: `zen-${Date.now()}-${Math.random().toString(36).substring(7)}`, // pseudo-ID
                });
                importedCount++;
            }
        }

        if (importedCount > 0) {
            notifyAllStudents("New Mental Wellness Quotes! 🧘‍♀️", `${importedCount} inspirational quotes have been added to help you relieve stress and focus.`);
        }

        res.status(200).json({ success: true, message: `Successfully imported ${importedCount} mental tips`, importedCount });
    } catch (error) {
        console.error("Error importing mental tips:", error.message);
        res.status(500).json({ success: false, message: 'Failed to import mental wellness tips from external API' });
    }
};

module.exports = {
    createTip,
    getAllTips,
    getTipById,
    getTipsByCategory,
    getPersonalizedTips,
    updateTip,
    deleteTip,
    importDietTips,
    importWorkoutTips,
    importMentalTips,
    scheduleTip
};
