'use strict';

const mongoose = require('mongoose');

const preferenceSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },
        emailNotifications: { type: Boolean, default: true },
        smsAlerts: { type: Boolean, default: false },
        pushNotifications: { type: Boolean, default: true },
        aiRiskAlerts: { type: Boolean, default: true },
        weeklyHealthSummary: { type: Boolean, default: true },
        medicationReminders: { type: Boolean, default: false },
    },
    { timestamps: false, versionKey: false }
);

module.exports = mongoose.model('Preference', preferenceSchema);
