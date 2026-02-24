'use strict';

/**
 * models/reportModel.js
 *
 * Mongoose schema & model for the `reports` collection.
 * Covers all 20+ AI dataset features as aggregated metrics per report period.
 */

const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    // ── Identity ────────────────────────────────────────────────
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user_id is required'],
      index: true,
    },
    report_type: {
      type: String,
      enum: ['weekly', 'monthly'],
      required: [true, 'report_type must be weekly or monthly'],
    },
    start_date: {
      type: Date,
      required: [true, 'start_date is required'],
    },
    end_date: {
      type: Date,
      required: [true, 'end_date is required'],
      validate: {
        validator(v) { return v >= this.start_date; },
        message: 'end_date must be on or after start_date',
      },
    },

    // ── Aggregated Physical / Lifestyle Metrics ──────────────────
    avg_sleep_duration: { type: Number, default: null },  // hours/night
    avg_sleep_quality: { type: Number, default: null },  // 1-10 scale
    avg_stress_level: { type: Number, default: null },  // 1-10 scale
    avg_heart_rate: { type: Number, default: null },  // bpm
    avg_blood_pressure: { type: Number, default: null },  // systolic mmHg
    avg_bmi: { type: Number, default: null },
    avg_steps: { type: Number, default: null },  // steps/day (integer)
    avg_calories: { type: Number, default: null },  // kcal/day
    avg_water_intake: { type: Number, default: null },  // litres/day
    avg_screen_time: { type: Number, default: null },  // hours/day
    avg_study_hours: { type: Number, default: null },  // hours/day

    // ── Aggregated Mental Health Metrics ─────────────────────────
    avg_anxiety_score: { type: Number, default: null },  // 0-21 GAD scale
    avg_depression_score: { type: Number, default: null },  // 0-27 PHQ scale

    // ── Demographic Averages ──────────────────────────────────────
    avg_age: { type: Number, default: null },
    avg_height: { type: Number, default: null },  // cm
    avg_weight: { type: Number, default: null },  // kg

    // ── Categorical Feature Snapshots ───────────────────────────
    gender: { type: String, default: null },
    smoking_status: { type: String, default: null },
    alcohol_consumption: { type: String, default: null },
    physical_activity: { type: String, default: null },
    medical_history: { type: String, default: null },
    family_history: { type: String, default: null },

    // ── AI Prediction Results ────────────────────────────────────
    predicted_risk_score: {
      type: Number,
      min: [0, 'Risk score cannot be below 0'],
      max: [1, 'Risk score cannot exceed 1'],
      default: null,
    },
    predicted_risk_level: {
      type: String,
      enum: ['low', 'moderate', 'high', null],
      default: null,
    },
  },
  {
    timestamps: true,   // adds createdAt, updatedAt automatically
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Compound Indexes for 150k+ document performance ──────────────────────────
reportSchema.index({ user_id: 1, start_date: -1, end_date: -1 }); // date filter queries
reportSchema.index({ user_id: 1, predicted_risk_level: 1 });       // risk aggregation
reportSchema.index({ user_id: 1, createdAt: -1 });                 // latest-first listing
reportSchema.index({ predicted_risk_level: 1 });                   // global risk queries

module.exports = mongoose.model('Report', reportSchema);
