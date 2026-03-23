'use strict';

const User = require('../models/User');
const StudentHealth = require('../models/studentHealthModel');
const { computeHealthScore } = require('../utils/healthCalculator');

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
            const { date, physiological, activity } = entry;
            
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

                healthEntry = await StudentHealth.create({
                    userId,
                    date,
                    physiological,
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
