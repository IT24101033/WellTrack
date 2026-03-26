'use strict';

/**
 * models/analyticsSummaryModel.js
 *
 * Per-user aggregated heart-rate analytics, updated whenever
 * a PDF is imported via importHealthPdf.
 */

const mongoose = require('mongoose');

const analyticsSummarySchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,   // one summary document per user
            index: true,
        },
        avg_hr: { type: Number, default: null },        // bpm (average of (hr_min+hr_max)/2)
        min_hr: { type: Number, default: null },        // lowest hr_min across all records
        max_hr: { type: Number, default: null },        // highest hr_max across all records
        exercise_sessions: { type: Number, default: 0 }, // count where tag === 'Exercising'
        total_records: { type: Number, default: 0 },
        last_updated: { type: Date, default: Date.now },
    },
    {
        timestamps: false,
        versionKey: false,
    }
);

module.exports = mongoose.model('AnalyticsSummary', analyticsSummarySchema);
