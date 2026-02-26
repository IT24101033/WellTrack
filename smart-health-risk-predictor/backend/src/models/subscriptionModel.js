'use strict';

const mongoose = require('mongoose');

const PLAN_FEATURES = {
    Free: ['Basic notifications', 'Daily health summary'],
    Premium: ['Basic notifications', 'Daily health summary', 'Medication alerts', 'Appointment reminders', 'Weekly reports'],
    Pro: ['Basic notifications', 'Daily health summary', 'Medication alerts', 'Appointment reminders', 'Weekly reports', 'Real-time AI risk alerts', 'Advanced analytics notifications', 'Priority support'],
};

const subscriptionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,   // one subscription per user
            index: true,
        },
        planName: {
            type: String,
            enum: ['Free', 'Premium', 'Pro'],
            default: 'Free',
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        endDate: {
            type: Date,
            default: () => {
                const d = new Date();
                d.setFullYear(d.getFullYear() + 1);
                return d;
            },
        },
        status: {
            type: String,
            enum: ['active', 'cancelled', 'expired'],
            default: 'active',
        },
        features: {
            type: [String],
            default: function () {
                return PLAN_FEATURES[this.planName] || PLAN_FEATURES.Free;
            },
        },
        autoRenew: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true, versionKey: false }
);

subscriptionSchema.statics.PLAN_FEATURES = PLAN_FEATURES;

module.exports = mongoose.model('Subscription', subscriptionSchema);
