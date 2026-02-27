'use strict';

const mongoose = require('mongoose');

const lifestyleTipSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Title is required.']
        },
        description: {
            type: String,
            required: [true, 'Description is required.']
        },
        category: {
            type: String,
            required: [true, 'Category is required.'],
            enum: ['DIET', 'WORKOUT', 'MENTAL']
        },
        difficulty_level: {
            type: String,
            required: [true, 'Difficulty level is required.'],
            enum: ['EASY', 'MEDIUM', 'HARD']
        },
        recommended_time: {
            type: String, // HH:MM
            default: ''
        },
        target_type: {
            type: String,
            enum: ['STRESS', 'SLEEP', 'FITNESS', 'GENERAL'],
            default: 'GENERAL'
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false // Nullable for external imports
        },
        source: {
            type: String,
            enum: ['ADMIN', 'EXTERNAL'],
            default: 'ADMIN'
        },
        external_id: {
            type: String,
            default: null
        },
        image_url: {
            type: String,
            default: null
        },
        is_active: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true // adds created_at and updated_at seamlessly as createdAt, updatedAt
    }
);

// Indexes specified in requirements
lifestyleTipSchema.index({ category: 1 });
lifestyleTipSchema.index({ target_type: 1 });

module.exports = mongoose.model('LifestyleTip', lifestyleTipSchema);
