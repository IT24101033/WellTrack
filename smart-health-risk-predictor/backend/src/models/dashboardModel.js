'use strict';

/**
 * models/dashboardModel.js
 *
 * Mongoose schema & model for the `analytics_dashboards` collection.
 * One document per user — upserted automatically on every report mutation.
 */

const mongoose = require('mongoose');

const dashboardSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,  // One dashboard doc per user
            index: true,
        },
        total_reports: { type: Number, default: 0 },
        latest_risk_level: { type: String, default: null },
        average_risk_score: { type: Number, default: null },
        high_risk_count: { type: Number, default: 0 },
        moderate_risk_count: { type: Number, default: 0 },
        low_risk_count: { type: Number, default: 0 },
        last_updated: { type: Date, default: Date.now },
    },
    {
        versionKey: false,
        timestamps: false,  // last_updated is managed manually for clarity
    }
);

module.exports = mongoose.model('AnalyticsDashboard', dashboardSchema);
