'use strict';

/**
 * models/WellnessTip.js
 *
 * Mongoose schema for the WellnessTip collection.
 * Used by the Food & Lifestyle Tips Management module.
 */

const mongoose = require('mongoose');

const wellnessTipSchema = new mongoose.Schema(
    {
        // ── Core content ──────────────────────────────────────────────────────────
        title: {
            type: String,
            required: [true, 'Title is required.'],
            trim: true,
            minlength: [3, 'Title must be at least 3 characters.'],
            maxlength: [200, 'Title must be at most 200 characters.'],
        },
        description: {
            type: String,
            required: [true, 'Description is required.'],
            trim: true,
            minlength: [10, 'Description must be at least 10 characters.'],
            maxlength: [5000, 'Description must be at most 5000 characters.'],
        },

        // ── Category ──────────────────────────────────────────────────────────────
        category: {
            type: String,
            required: [true, 'Category is required.'],
            enum: {
                values: ['diet', 'workout', 'mental'],
                message: 'Category must be one of: diet, workout, mental.',
            },
            lowercase: true,
        },

        // ── Extra metadata ─────────────────────────────────────────────────────────
        tags: {
            type: [String],
            default: [],
        },

        // ── Timeline fields (optional) ────────────────────────────────────────────
        time: {
            type: String,
            default: '',
            match: [/^([01]\d|2[0-3]):[0-5]\d$|^$/, 'Time must be in HH:MM format (e.g. 07:30).'],
        },
        duration: {
            type: String,
            trim: true,
            default: '',
            maxlength: [50, 'Duration must be at most 50 characters.'],
        },

        // ── Ownership ─────────────────────────────────────────────────────────────
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Creator reference is required.'],
        },

        // ── Moderation status ─────────────────────────────────────────────────────
        status: {
            type: String,
            enum: {
                values: ['approved', 'pending'],
                message: 'Status must be either approved or pending.',
            },
            default: 'pending',
        },
    },
    {
        timestamps: true, // adds createdAt + updatedAt
        toJSON: {
            virtuals: true,
            transform: (_doc, ret) => {
                delete ret.__v;
                return ret;
            },
        },
    }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
// Full-text search on title + description
wellnessTipSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Efficient filter queries
wellnessTipSchema.index({ category: 1, status: 1 });
wellnessTipSchema.index({ createdBy: 1 });
wellnessTipSchema.index({ createdAt: -1 }); // default sort: newest first

module.exports = mongoose.model('WellnessTip', wellnessTipSchema);
