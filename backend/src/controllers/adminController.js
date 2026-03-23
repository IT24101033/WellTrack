'use strict';

const User = require('../models/User');
const Report = require('../models/reportModel');
const Subscription = require('../models/subscriptionModel');

const ok = (res, data, status = 200) => res.status(status).json({ success: true, ...data });
const fail = (res, message, status = 500) => res.status(status).json({ success: false, message });

// GET /api/admin/analytics
const getSystemAnalytics = async (req, res) => {
    try {
        const [
            totalUsers,
            totalReports,
            premiumUsers,
            recentUsers,
            riskBreakdown
        ] = await Promise.all([
            User.countDocuments({ role: 'student' }),
            Report.countDocuments(),
            Subscription.countDocuments({ status: 'active', planName: { $in: ['Premium', 'Pro'] } }),
            User.find({ role: 'student' }).sort({ createdAt: -1 }).limit(5).select('fullName email createdAt'),
            Report.aggregate([
                { $group: { _id: '$predicted_risk_level', count: { $sum: 1 } } }
            ])
        ]);

        const riskStats = { high: 0, moderate: 0, low: 0 };
        riskBreakdown.forEach(item => {
            if (item._id === 'high') riskStats.high = item.count;
            if (item._id === 'moderate') riskStats.moderate = item.count;
            if (item._id === 'low') riskStats.low = item.count;
        });

        ok(res, {
            analytics: {
                totalUsers,
                totalReports,
                premiumUsers,
                recentUsers,
                riskStats
            }
        });
    } catch (err) {
        console.error('[getSystemAnalytics]', err);
        fail(res, 'Failed to fetch system analytics');
    }
};

module.exports = { getSystemAnalytics };
