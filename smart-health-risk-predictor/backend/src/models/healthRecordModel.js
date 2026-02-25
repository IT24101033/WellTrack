'use strict';

/**
 * models/healthRecordModel.js
 *
 * Individual heart-rate records extracted from a PDF upload.
 * source is always "pdf_import" for records created by importHealthPdf.
 */

const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'user_id is required'],
            index: true,
        },
        date: {
            type: String, // stored as YYYY-MM-DD string for easy querying
            required: [true, 'date is required'],
        },
        time: {
            type: String, // stored as HH:MM string
            default: null,
        },
        hr_min: {
            type: Number,
            required: [true, 'hr_min is required'],
            min: 0,
        },
        hr_max: {
            type: Number,
            required: [true, 'hr_max is required'],
            min: 0,
        },
        tag: {
            type: String,
            enum: ['Exercising', 'Normal', 'Unknown'],
            default: 'Normal',
        },
        notes: {
            type: String,
            default: null,
        },
        source: {
            type: String,
            default: 'pdf_import',
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Prevent duplicate entries: same user, date, and time slot
healthRecordSchema.index({ user_id: 1, date: 1, time: 1 }, { unique: true });

// Fast lookups by user + date range
healthRecordSchema.index({ user_id: 1, date: -1 });

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
