'use strict';

const Preference = require('../models/preferenceModel');

const ok = (res, data, status = 200) => res.status(status).json({ success: true, ...data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });

const ALLOWED_FIELDS = [
    'emailNotifications', 'smsAlerts', 'pushNotifications',
    'aiRiskAlerts', 'weeklyHealthSummary', 'medicationReminders',
];

// GET /api/preferences  — get own preferences (auto-creates defaults if none exist)
const getPreferences = async (req, res) => {
    try {
        let preferences = await Preference.findOne({ userId: req.user.id });
        if (!preferences) {
            preferences = await Preference.create({ userId: req.user.id });
        }
        return ok(res, { preferences });
    } catch (err) {
        console.error('[getPreferences]', err);
        return fail(res, 'Failed to fetch preferences.', 500);
    }
};

// PUT /api/preferences  — update preferences (boolean toggles only)
const updatePreferences = async (req, res) => {
    try {
        const updates = {};
        for (const field of ALLOWED_FIELDS) {
            if (typeof req.body[field] === 'boolean') {
                updates[field] = req.body[field];
            }
        }
        if (Object.keys(updates).length === 0) {
            return fail(res, 'No valid preference fields provided.', 400);
        }
        const preferences = await Preference.findOneAndUpdate(
            { userId: req.user.id },
            { $set: updates },
            { new: true, upsert: true }
        );
        return ok(res, { preferences, message: 'Preferences saved.' });
    } catch (err) {
        console.error('[updatePreferences]', err);
        return fail(res, 'Failed to update preferences.', 500);
    }
};

module.exports = { getPreferences, updatePreferences };
