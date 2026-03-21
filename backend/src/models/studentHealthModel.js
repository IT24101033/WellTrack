'use strict';

/**
 * models/studentHealthModel.js
 * 
 * Comprehensive daily health record for AI-ready student health tracking.
 * One document per student per day (compound unique index).
 */

const mongoose = require('mongoose');

const studentHealthSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'userId is required'],
            index: true,
        },
        date: {
            type: String, // YYYY-MM-DD for easy querying and uniqueness
            required: [true, 'date is required'],
        },

        // ── 1. Physiological ────────────────────────────────────────────
        physiological: {
            height: { type: Number, min: 50, max: 300, default: null },       // cm
            weight: { type: Number, min: 10, max: 500, default: null },       // kg
            bmi: { type: Number, min: 5, max: 100, default: null },           // auto-computed
            restingHeartRate: { type: Number, min: 30, max: 250, default: null }, // bpm
            sleepHours: { type: Number, min: 0, max: 24, default: null },
            sleepQuality: { type: Number, min: 1, max: 10, default: null },
        },

        // ── 2. Lifestyle & Nutrition ─────────────────────────────────────
        lifestyle: {
            waterIntake: { type: Number, min: 0, max: 20, default: null },    // litres
            junkFoodFrequency: {
                type: String,
                enum: ['Never', 'Weekly', '2-3 times', 'Daily'],
                default: null,
            },
            caffeineIntake: { type: Number, min: 0, max: 30, default: null }, // cups/day
            mealRegularity: {
                type: String,
                enum: ['Regular', 'Irregular'],
                default: null,
            },
        },

        // ── 3. Activity & Behavioral ─────────────────────────────────────
        activity: {
            stepsPerDay: { type: Number, min: 0, max: 100000, default: null },
            exerciseMinutes: { type: Number, min: 0, max: 1440, default: null },
            sedentaryHours: { type: Number, min: 0, max: 24, default: null },
            screenTimeHours: { type: Number, min: 0, max: 24, default: null },
            lateNightScreen: { type: Boolean, default: false },
        },

        // ── 4. Psychological & Social ────────────────────────────────────
        psychological: {
            stressScore: { type: Number, min: 1, max: 10, default: null },
            moodScore: { type: Number, min: 1, max: 10, default: null },
            socialInteractionLevel: {
                type: String,
                enum: ['Low', 'Medium', 'High'],
                default: null,
            },
            weekendSleepShift: { type: Number, min: -12, max: 12, default: null }, // hours diff
        },

        // ── Computed / derived ───────────────────────────────────────────
        healthScore: { type: Number, min: 0, max: 100, default: null }, // 0–100
        riskAlert: { type: Boolean, default: false }, // stress > 8 && sleep < 5
    },
    { timestamps: true, versionKey: false }
);

// One entry per user per day
studentHealthSchema.index({ userId: 1, date: 1 }, { unique: true });

// Fast range queries: userId + date range
studentHealthSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('StudentHealth', studentHealthSchema);
