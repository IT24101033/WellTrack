'use strict';

const StudentHealth = require('../models/studentHealthModel');
const { computeBMI, computeHealthScore } = require('../utils/healthCalculator');

const ok = (res, data, status = 200) => res.status(status).json({ success: true, ...data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build today's YYYY-MM-DD string */
const todayStr = () => new Date().toISOString().slice(0, 10);

// ── Controllers ───────────────────────────────────────────────────────────────

// POST /api/health
const createEntry = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            date,
            physiological = {},
            lifestyle = {},
            activity = {},
            psychological = {},
        } = req.body;

        const entryDate = date || todayStr();

        // Auto-compute BMI
        const bmi = computeBMI(physiological.height, physiological.weight);
        const physData = { ...physiological, bmi };

        // Health score + risk alert
        const payload = { physiological: physData, lifestyle, activity, psychological };
        const healthScore = computeHealthScore(payload);
        const riskAlert = (psychological.stressScore > 8) && (physiological.sleepHours < 5);

        const entry = await StudentHealth.create({
            userId,
            date: entryDate,
            physiological: physData,
            lifestyle,
            activity,
            psychological,
            healthScore,
            riskAlert,
        });

        return ok(res, { entry }, 201);
    } catch (err) {
        if (err.code === 11000) {
            return fail(res, 'A health record already exists for this date. Use PUT to update it.', 409);
        }
        console.error('[createEntry]', err);
        return fail(res, 'Failed to create health entry.', 500);
    }
};

// GET /api/health  →  own records, optional ?limit=7&from=YYYY-MM-DD&to=YYYY-MM-DD
const getEntries = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 30, from, to } = req.query;

        const dateFilter = {};
        if (from) dateFilter.$gte = from;
        if (to) dateFilter.$lte = to;

        const query = { userId };
        if (Object.keys(dateFilter).length) query.date = dateFilter;

        const entries = await StudentHealth.find(query)
            .sort({ date: -1 })
            .limit(Number(limit));

        return ok(res, { entries, count: entries.length });
    } catch (err) {
        console.error('[getEntries]', err);
        return fail(res, 'Failed to fetch health entries.', 500);
    }
};

// GET /api/health/ai-input  →  last 30 days normalised for ML
const getAIInput = async (req, res) => {
    try {
        const userId = req.user.id;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const fromDate = thirtyDaysAgo.toISOString().slice(0, 10);

        const entries = await StudentHealth.find({ userId, date: { $gte: fromDate } })
            .sort({ date: 1 })
            .select('-_id -userId -createdAt -updatedAt');

        // Flatten to feature vector array for ML model
        const features = entries.map(e => ({
            date: e.date,
            bmi: e.physiological?.bmi,
            restingHeartRate: e.physiological?.restingHeartRate,
            sleepHours: e.physiological?.sleepHours,
            sleepQuality: e.physiological?.sleepQuality,
            waterIntake: e.lifestyle?.waterIntake,
            junkFoodFrequency: e.lifestyle?.junkFoodFrequency,
            caffeineIntake: e.lifestyle?.caffeineIntake,
            mealRegularity: e.lifestyle?.mealRegularity,
            stepsPerDay: e.activity?.stepsPerDay,
            exerciseMinutes: e.activity?.exerciseMinutes,
            sedentaryHours: e.activity?.sedentaryHours,
            screenTimeHours: e.activity?.screenTimeHours,
            lateNightScreen: e.activity?.lateNightScreen,
            stressScore: e.psychological?.stressScore,
            moodScore: e.psychological?.moodScore,
            socialInteractionLevel: e.psychological?.socialInteractionLevel,
            weekendSleepShift: e.psychological?.weekendSleepShift,
            healthScore: e.healthScore,
            riskAlert: e.riskAlert,
        }));

        // Aggregate averages
        const avg = (arr, fn) => {
            const vals = arr.map(fn).filter(v => v != null);
            return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : null;
        };

        const aggregated = {
            period: { from: fromDate, to: todayStr(), recordCount: entries.length },
            averages: {
                bmi: avg(features, f => f.bmi),
                sleepHours: avg(features, f => f.sleepHours),
                sleepQuality: avg(features, f => f.sleepQuality),
                stressScore: avg(features, f => f.stressScore),
                moodScore: avg(features, f => f.moodScore),
                stepsPerDay: avg(features, f => f.stepsPerDay),
                exerciseMinutes: avg(features, f => f.exerciseMinutes),
                screenTimeHours: avg(features, f => f.screenTimeHours),
                waterIntake: avg(features, f => f.waterIntake),
                healthScore: avg(features, f => f.healthScore),
            },
            riskAlertDays: features.filter(f => f.riskAlert).length,
            dailyFeatures: features,
        };

        return ok(res, { aiInput: aggregated });
    } catch (err) {
        console.error('[getAIInput]', err);
        return fail(res, 'Failed to generate AI input.', 500);
    }
};

// GET /api/health/:id
const getEntry = async (req, res) => {
    try {
        const entry = await StudentHealth.findOne({ _id: req.params.id, userId: req.user.id });
        if (!entry) return fail(res, 'Entry not found.', 404);
        return ok(res, { entry });
    } catch (err) {
        console.error('[getEntry]', err);
        return fail(res, 'Failed to fetch entry.', 500);
    }
};

// PUT /api/health/:id
const updateEntry = async (req, res) => {
    try {
        const { physiological = {}, lifestyle = {}, activity = {}, psychological = {}, date } = req.body;

        // Re-compute BMI if height/weight provided
        const existing = await StudentHealth.findOne({ _id: req.params.id, userId: req.user.id });
        if (!existing) return fail(res, 'Entry not found.', 404);

        const mergedPhysio = { ...existing.physiological.toObject(), ...physiological };
        mergedPhysio.bmi = computeBMI(mergedPhysio.height, mergedPhysio.weight) ?? mergedPhysio.bmi;

        const mergedLifestyle = { ...existing.lifestyle.toObject(), ...lifestyle };
        const mergedActivity = { ...existing.activity.toObject(), ...activity };
        const mergedPsycho = { ...existing.psychological.toObject(), ...psychological };

        const payload = {
            physiological: mergedPhysio,
            lifestyle: mergedLifestyle,
            activity: mergedActivity,
            psychological: mergedPsycho,
        };
        const healthScore = computeHealthScore(payload);
        const riskAlert = (mergedPsycho.stressScore > 8) && (mergedPhysio.sleepHours < 5);

        const updated = await StudentHealth.findByIdAndUpdate(
            req.params.id,
            { $set: { ...payload, healthScore, riskAlert, ...(date ? { date } : {}) } },
            { new: true, runValidators: true }
        );

        return ok(res, { entry: updated });
    } catch (err) {
        if (err.code === 11000) return fail(res, 'Duplicate date entry.', 409);
        console.error('[updateEntry]', err);
        return fail(res, 'Failed to update entry.', 500);
    }
};

// DELETE /api/health/:id
const deleteEntry = async (req, res) => {
    try {
        const entry = await StudentHealth.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!entry) return fail(res, 'Entry not found.', 404);
        return ok(res, { message: 'Health entry deleted.' });
    } catch (err) {
        console.error('[deleteEntry]', err);
        return fail(res, 'Failed to delete entry.', 500);
    }
};

module.exports = { createEntry, getEntries, getEntry, updateEntry, deleteEntry, getAIInput };
