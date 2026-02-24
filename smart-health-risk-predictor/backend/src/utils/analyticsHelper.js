'use strict';

/**
 * utils/analyticsHelper.js
 *
 * Pure utility functions — no DB calls, fully testable in isolation.
 *
 * Exports:
 *  classifyRisk         — score  →  'low' | 'moderate' | 'high'
 *  computeAggregates    — raw health_data[]  →  averaged metric object
 *  validateReportInput  — validates POST / PUT body
 *  validateDateFilter   — validates ?start= ?end= query params
 *  sanitizeId           — validates any MongoDB ObjectId-like string / positive int
 */

const mongoose = require('mongoose');

// ─── Risk Classification ──────────────────────────────────────────────────────
/**
 * Map a normalised AI risk score (0.0 – 1.0) to a human-readable level.
 * Thresholds align with common clinical stratification conventions.
 *
 * @param {number} score
 * @returns {'low'|'moderate'|'high'|'unknown'}
 */
const classifyRisk = (score) => {
    const s = parseFloat(score);
    if (isNaN(s)) return 'unknown';
    if (s < 0.35) return 'low';
    if (s < 0.65) return 'moderate';
    return 'high';
};

// ─── Aggregate Computation ────────────────────────────────────────────────────
/**
 * Compute averages for all numeric health metrics from an array of raw records.
 * Silently skips null / NaN values so partial records don't skew averages.
 *
 * @param {Object[]} rows  Array of health-data records
 * @returns {Object}       Averaged metric object ready for reportModel
 */
const computeAggregates = (rows) => {
    if (!Array.isArray(rows) || rows.length === 0) return {};

    const numericFields = [
        'sleep_duration',
        'sleep_quality',
        'stress_level',
        'heart_rate',
        'blood_pressure',
        'bmi',
        'steps_count',
        'calorie_intake',
        'water_intake',
        'screen_time',
        'study_hours',
        'anxiety_score',
        'depression_score',
        'age',
        'height',
        'weight',
    ];

    const sums = {};
    const counts = {};
    numericFields.forEach((f) => { sums[f] = 0; counts[f] = 0; });

    rows.forEach((row) => {
        numericFields.forEach((f) => {
            const v = parseFloat(row[f]);
            if (!isNaN(v)) { sums[f] += v; counts[f] += 1; }
        });
    });

    const avg = (field) =>
        counts[field] > 0 ? parseFloat((sums[field] / counts[field]).toFixed(4)) : null;

    return {
        avg_sleep_duration: avg('sleep_duration'),
        avg_sleep_quality: avg('sleep_quality'),
        avg_stress_level: avg('stress_level'),
        avg_heart_rate: avg('heart_rate'),
        avg_blood_pressure: avg('blood_pressure'),
        avg_bmi: avg('bmi'),
        avg_steps: counts.steps_count > 0
            ? Math.round(sums.steps_count / counts.steps_count)
            : null,
        avg_calories: avg('calorie_intake'),
        avg_water_intake: avg('water_intake'),
        avg_screen_time: avg('screen_time'),
        avg_study_hours: avg('study_hours'),
        avg_anxiety_score: avg('anxiety_score'),
        avg_depression_score: avg('depression_score'),
        avg_age: avg('age'),
        avg_height: avg('height'),
        avg_weight: avg('weight'),
    };
};

// ─── Input Validation ─────────────────────────────────────────────────────────
/**
 * Validate req.body for POST /api/reports and PUT /api/reports/:id.
 *
 * @param {Object} body
 * @returns {{ valid: boolean, errors: string[] }}
 */
const validateReportInput = (body) => {
    const errors = [];

    if (!body.user_id) {
        errors.push('user_id is required.');
    }

    const validTypes = ['weekly', 'monthly'];
    if (!body.report_type || !validTypes.includes(body.report_type)) {
        errors.push(`report_type must be one of: ${validTypes.join(', ')}.`);
    }

    if (!body.start_date || !isValidDate(body.start_date)) {
        errors.push('start_date must be a valid date (YYYY-MM-DD).');
    }

    if (!body.end_date || !isValidDate(body.end_date)) {
        errors.push('end_date must be a valid date (YYYY-MM-DD).');
    }

    if (
        errors.length === 0 &&
        new Date(body.end_date) < new Date(body.start_date)
    ) {
        errors.push('end_date cannot be before start_date.');
    }

    if (
        !body.health_data ||
        !Array.isArray(body.health_data) ||
        body.health_data.length === 0
    ) {
        errors.push('health_data must be a non-empty array of health records.');
    }

    if (body.predicted_risk_score !== undefined) {
        const s = parseFloat(body.predicted_risk_score);
        if (isNaN(s) || s < 0 || s > 1) {
            errors.push('predicted_risk_score must be a float between 0.0 and 1.0.');
        }
    }

    return { valid: errors.length === 0, errors };
};

/**
 * Validate ?start and ?end query-string params for date filtering.
 *
 * @param {string} start
 * @param {string} end
 * @returns {{ valid: boolean, errors: string[] }}
 */
const validateDateFilter = (start, end) => {
    const errors = [];
    if (!start || !isValidDate(start)) errors.push('start must be YYYY-MM-DD.');
    if (!end || !isValidDate(end)) errors.push('end must be YYYY-MM-DD.');
    if (errors.length === 0 && new Date(end) < new Date(start)) {
        errors.push('end date cannot be before start date.');
    }
    return { valid: errors.length === 0, errors };
};

/**
 * Validate a MongoDB ObjectId string.
 *
 * @param {string} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── Internal helpers ─────────────────────────────────────────────────────────
const isValidDate = (str) => {
    if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
    return !isNaN(new Date(str).getTime());
};

module.exports = {
    classifyRisk,
    computeAggregates,
    validateReportInput,
    validateDateFilter,
    isValidObjectId,
};
