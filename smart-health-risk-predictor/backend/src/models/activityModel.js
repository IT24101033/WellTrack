'use strict';

/**
 * models/activityModel.js
 * Activity schema for the Schedule & Activity Management module.
 */

const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: 200,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: '',
        },
        category: {
            type: String,
            enum: ['Workout', 'Study', 'Sleep', 'Meal', 'Break'],
            required: [true, 'Category is required'],
            index: true,
        },
        date: {
            type: Date,
            required: [true, 'Date is required'],
            index: true,
        },
        startTime: {
            type: String,
            required: [true, 'Start time is required'],
            match: [/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format'],
        },
        endTime: {
            type: String,
            required: [true, 'End time is required'],
            match: [/^\d{2}:\d{2}$/, 'End time must be in HH:MM format'],
        },
        status: {
            type: String,
            enum: ['Pending', 'Completed'],
            default: 'Pending',
            index: true,
        },
        reminderEnabled: {
            type: Boolean,
            default: false,
        },
        reminderTimeBefore: {
            type: Number,
            min: 0,
            max: 1440, // max 24 hours in minutes
            default: 15,
        },
    },
    { timestamps: true, versionKey: false }
);

// Compound index for common query: userId + date
activitySchema.index({ userId: 1, date: 1 });
activitySchema.index({ userId: 1, category: 1 });
activitySchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Activity', activitySchema);
