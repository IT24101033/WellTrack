'use strict';

/**
 * models/reminderModel.js
 * Reminder schema — tracks scheduled reminder trigger times for activities.
 */

const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
    {
        activityId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Activity',
            required: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        triggerTime: {
            type: Date,
            required: true,
            index: true,
        },
        isSent: {
            type: Boolean,
            default: false,
            index: true,
        },
        isAcknowledged: {
            type: Boolean,
            default: false,
            index: true,
        },
        activityTitle: {
            type: String,
            trim: true,
        },
        activityCategory: {
            type: String,
        },
    },
    { timestamps: true, versionKey: false }
);

// Compound index for scheduler query: unsent reminders due now
reminderSchema.index({ triggerTime: 1, isSent: 1 });
reminderSchema.index({ userId: 1, isSent: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);
