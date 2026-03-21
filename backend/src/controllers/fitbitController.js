'use strict';

const { generateAuthUrl, exchangeCodeForTokens, fetchFitbitData } = require('../utils/fitbitService');
const User = require('../models/User');

/**
 * getAuthUrl
 * GET /api/fitbit/auth-url
 */
const getAuthUrl = (req, res) => {
    const url = generateAuthUrl();
    if (!url) {
        return res.status(500).json({ success: false, message: 'Fitbit configuration missing.' });
    }
    res.status(200).json({ success: true, url });
};

/**
 * handleCallback
 * GET /api/fitbit/callback?code=...
 */
const handleCallback = async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) return res.status(400).json({ success: false, message: 'Code is required.' });

        const tokens = await exchangeCodeForTokens(code);

        // We need the userId. In a real browser flow, we'd use state or a temporary cookie.
        // For now, we assume the user is authenticated in the session if possible, 
        // but OAuth callbacks often lose session context if not handled carefully.
        // Assuming we have middleware that might re-attach it or we use a redirect-back with a token.
        
        // Mocking user attachment for now (in production, use 'state' param to pass encrypted userId)
        if (req.user) {
            await User.findByIdAndUpdate(req.user.id, {
                fitbitAccessToken: tokens.access_token,
                fitbitRefreshToken: tokens.refresh_token,
                fitbitUserId: tokens.user_id
            });
        }

        res.status(200).json({ success: true, message: 'Fitbit connected successfully. You can close this window.' });
    } catch (err) {
        console.error('[fitbitController.handleCallback]', err.response?.data || err.message);
        res.status(500).json({ success: false, message: 'Failed to exchange Fitbit code.' });
    }
};

/**
 * syncData
 * POST /api/fitbit/sync
 */
const syncData = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.fitbitAccessToken) {
            return res.status(400).json({ success: false, message: 'Fitbit not connected.' });
        }

        // Example: sync heart rate for today
        const heartData = await fetchFitbitData(user.fitbitAccessToken, 'activities/heart/date/today/1d.json');
        
        // In a real app, parse and save to HealthRecordModel/ActivityModel
        res.status(200).json({ success: true, data: heartData });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAuthUrl,
    handleCallback,
    syncData
};
