'use strict';

const LifestyleTip = require('../models/lifestyleTipModel');
const axios = require('axios');

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
                    title: exercise.name,
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
    importMentalTips
};
