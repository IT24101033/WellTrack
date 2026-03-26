'use strict';

/**
 * models/uploadedReportModel.js
 *
 * Metadata record for each PDF file uploaded by a user.
 * The actual file is NOT stored — only the parsed metadata.
 */

const mongoose = require('mongoose');

const uploadedReportSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        file_name: {
            type: String,
            required: true,
        },
        date_range: {
            start: { type: String, default: null },  // "YYYY-MM-DD"
            end: { type: String, default: null },
        },
        records_count: {
            type: Number,
            default: 0,
        },
        uploaded_at: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false,
        versionKey: false,
    }
);

module.exports = mongoose.model('UploadedReport', uploadedReportSchema);
