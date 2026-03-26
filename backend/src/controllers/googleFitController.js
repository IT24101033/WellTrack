'use strict';

const User = require('../models/User');
const StudentHealth = require('../models/studentHealthModel');
const { computeHealthScore } = require('../utils/healthCalculator');

/**
 * Sanitize physiological data from Google Fit.
 * Google Fit may return 0 for unavailable metrics which would fail
 * Mongoose min-value validators. Replace invalid values with null.
 */
const sanitizePhysiological = (physio = {}) => ({
    height:           (physio.height           > 0)  ? physio.height           : null,
    weight:           (physio.weight           > 0)  ? physio.weight           : null,
    bmi:              (physio.bmi              > 0)  ? physio.bmi              : null,
    restingHeartRate: (physio.restingHeartRate >= 30) ? physio.restingHeartRate : null,
    sleepHours:       (physio.sleepHours       != null && physio.sleepHours >= 0) ? physio.sleepHours : null,
    sleepQuality:     (physio.sleepQuality     >= 1)  ? physio.sleepQuality    : null,
});

/**
 * syncData
 * POST /api/google-fit/sync
 * 
 * Receives synced data from frontend and saves to database.
 * This ensures data persistence even if frontend state is lost.
 */
const syncData = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { entries } = req.body;

        if (!entries || !Array.isArray(entries)) {
            return res.status(400).json({ success: false, message: 'Invalid entries data.' });
        }

        const results = [];
        for (const entry of entries) {
            const { date, activity } = entry;
            const physiological = sanitizePhysiological(entry.physiological);
            
            // Check for existing entry
            let healthEntry = await StudentHealth.findOne({ userId, date });
            
            if (healthEntry) {
                // Update existing
                healthEntry.physiological = { ...healthEntry.physiological.toObject(), ...physiological };
                healthEntry.activity = { ...healthEntry.activity.toObject(), ...activity };
                
                // Recalculate AI Health Score and Risk
                const payload = {
                    physiological: healthEntry.physiological,
                    activity: healthEntry.activity,
                    lifestyle: healthEntry.lifestyle,
                    psychological: healthEntry.psychological
                };
                healthEntry.healthScore = computeHealthScore(payload);
                healthEntry.riskAlert = (healthEntry.psychological?.stressScore > 8) && (healthEntry.physiological?.sleepHours < 5);

                await healthEntry.save();
            } else {
                // Create new
                // Default subdocuments for empty schemas
                const payload = {
                    physiological,
                    activity,
                    lifestyle: {},
                    psychological: {}
                };
                const healthScore = computeHealthScore(payload);
                const riskAlert = false; // no stress data on newly created from fit

                // Filter out null values so Mongoose doesn't validate absent fields
                const cleanPhysio = Object.fromEntries(
                    Object.entries(physiological).filter(([, v]) => v !== null)
                );

                healthEntry = await StudentHealth.create({
                    userId,
                    date,
                    physiological: cleanPhysio,
                    activity,
                    healthScore,
                    riskAlert
                });
            }
            results.push(healthEntry);
        }

        res.status(200).json({ 
            success: true, 
            message: `Successfully synced ${results.length} entries.`,
            count: results.length
        });
    } catch (err) {
        console.error('[googleFitController.syncData]', err);
        next(err);
    }
};

module.exports = {
    syncData
};
