'use strict';

/**
 * controllers/predictionController.js
 *
 * Proxy between the Node.js backend and the Python FastAPI ML service.
 * Accepts health data, maps it to the AI service schema, and returns
 * a structured prediction result.
 *
 * ML Service: http://localhost:8000  (FastAPI / XGBoost)
 */

const axios = require('axios');
const StudentHealth = require('../models/studentHealthModel');
const User = require('../models/User');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Map MongoDB StudentHealth entry → Python ML service input schema.
 */
const mapEntryToMLInput = (entry, user = {}) => ({
    age:                    user.age                              ?? 22,
    gender:                 user.gender === 'male' ? 'Male'
                          : user.gender === 'female' ? 'Female'
                          : 'Other',
    height_cm:              entry.physiological?.height           ?? (user.height ?? 170),
    weight_kg:              entry.physiological?.weight           ?? (user.weight ?? 65),
    bmi:                    entry.physiological?.bmi              ?? null,
    resting_heart_rate:     entry.physiological?.restingHeartRate ?? 72,
    sleep_hours:            entry.physiological?.sleepHours       ?? 7,
    sleep_quality:          entry.physiological?.sleepQuality     ?? 7,
    water_intake_liters:    entry.lifestyle?.waterIntake          ?? 2,
    junk_food_frequency:    entry.lifestyle?.junkFoodFrequency    ?? 'Weekly',
    caffeine_intake_cups:   entry.lifestyle?.caffeineIntake       ?? 2,
    meal_regularity:        entry.lifestyle?.mealRegularity       ?? 'Regular',
    steps_per_day:          entry.activity?.stepsPerDay           ?? 7000,
    exercise_minutes:       entry.activity?.exerciseMinutes       ?? 30,
    sedentary_hours:        entry.activity?.sedentaryHours        ?? 6,
    screen_time_hours:      entry.activity?.screenTimeHours       ?? 4,
    late_night_screen:      entry.activity?.lateNightScreen       ?? false,
    stress_score:           entry.psychological?.stressScore      ?? 4,
    mood_score:             entry.psychological?.moodScore        ?? 7,
    social_interaction_level: entry.psychological?.socialInteractionLevel ?? 'Medium',
    weekend_sleep_shift_hours: entry.psychological?.weekendSleepShift ?? 1,
});

// ── POST /api/predict — predict from stored latest health entry ───────────────
const predictRisk = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Fetch user profile for age/gender/height/weight
        const user = await User.findById(userId).lean();

        // 2. Fetch latest health entry (or use body override)
        let mlInput;
        if (req.body && Object.keys(req.body).length > 0) {
            // Direct input from request body (manual override)
            mlInput = req.body;
        } else {
            const entry = await StudentHealth.findOne({ userId })
                .sort({ date: -1 })
                .lean();

            if (!entry) {
                return res.status(404).json({
                    success: false,
                    message: 'No health entries found. Please add at least one health record before running a prediction.',
                });
            }
            mlInput = mapEntryToMLInput(entry, user || {});
        }

        // 3. Call the Python ML service
        const mlRes = await axios.post(`${ML_SERVICE_URL}/predict`, mlInput, {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' },
        });

        const result = mlRes.data;
        const { risk_pct, confidence } = result.prediction;

        // 4. Update the stored health record with AI results
        // This syncs the "Health Score" (100 - risk%) on the dashboard
        const healthScore = Math.max(0, Math.min(100, Math.round(100 - risk_pct)));

        await StudentHealth.findOneAndUpdate(
            { userId, date: mlInput.date || new Date().toISOString().slice(0, 10) },
            { 
                $set: { 
                    aiRisk: risk_pct, 
                    aiConfidence: confidence,
                    healthScore: healthScore
                } 
            },
            { sort: { date: -1 } } // ensure we update the latest if date is today
        );

        // 5. Return enriched response
        return res.status(200).json({
            success: true,
            prediction: result.prediction,
            input_summary: result.input_summary,
            source: 'xgboost_v1',
            timestamp: new Date().toISOString(),
        });

    } catch (err) {
        // ML service offline
        if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
            return res.status(503).json({
                success: false,
                message: 'AI prediction service is offline. Please start the ml service (cd ai-service && uvicorn main:app).',
                offline: true,
            });
        }
        if (err.response?.data) {
            return res.status(err.response.status || 500).json({
                success: false,
                message: err.response.data.detail || 'Prediction failed.',
            });
        }
        console.error('[predictRisk]', err);
        return res.status(500).json({ success: false, message: 'Prediction service error.' });
    }
};

// ── GET /api/predict/status — check if ML service is alive ───────────────────
const mlServiceStatus = async (req, res) => {
    try {
        const r = await axios.get(`${ML_SERVICE_URL}/`, { timeout: 3000 });
        return res.status(200).json({
            success: true,
            online: true,
            model_loaded: r.data?.model_loaded ?? false,
            service_url: ML_SERVICE_URL,
        });
    } catch {
        return res.status(200).json({
            success: true,
            online: false,
            model_loaded: false,
            service_url: ML_SERVICE_URL,
        });
    }
};

module.exports = { predictRisk, mlServiceStatus };
