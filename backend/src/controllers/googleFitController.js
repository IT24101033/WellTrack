'use strict';

const User = require('../models/User');
const StudentHealth = require('../models/studentHealthModel');

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
                healthEntry.physiological = { ...healthEntry.physiological, ...physiological };
                healthEntry.activity = { ...healthEntry.activity, ...activity };
                await healthEntry.save();
            } else {
                // Create new
                healthEntry = await StudentHealth.create({
                    userId,
                    date,
                    physiological,
                    activity
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
