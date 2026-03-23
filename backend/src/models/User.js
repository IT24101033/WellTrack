'use strict';

/**
 * models/User.js
 * Mongoose schema for the User collection.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const activityLogSchema = new mongoose.Schema(
    {
        action: { type: String, required: true },
        details: { type: String, default: '' },
        ip: { type: String, default: '' },
    },
    { _id: false, timestamps: { createdAt: 'performedAt', updatedAt: false } }
);

const userSchema = new mongoose.Schema(
    {
        // ── Core identity ──────────────────────────────────────────────────────
        fullName: {
            type: String,
            required: [true, 'Full name is required.'],
            trim: true,
            minlength: [2, 'Full name must be at least 2 characters.'],
            maxlength: [100, 'Full name must be at most 100 characters.'],
        },
        email: {
            type: String,
            required: [true, 'Email is required.'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address.'],
        },
        password: {
            type: String,
            required: [true, 'Password is required.'],
            minlength: [6, 'Password must be at least 6 characters.'],
            select: false, // never returned in queries by default
        },

        // ── Role & status ──────────────────────────────────────────────────────
        role: {
            type: String,
            enum: { values: ['student', 'admin'], message: 'Role must be student or admin.' },
            default: 'student',
        },
        isActive: {
            type: Boolean,
            default: true,
        },

        // ── Health profile ─────────────────────────────────────────────────────
        age: {
            type: Number,
            min: [0, 'Age cannot be negative.'],
            max: [150, 'Age seems too high.'],
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other', ''],
            default: '',
        },
        height: {
            type: Number, // in cm
            min: [0, 'Height cannot be negative.'],
        },
        weight: {
            type: Number, // in kg
            min: [0, 'Weight cannot be negative.'],
        },
        universityId: {
            type: String,
            trim: true,
            maxlength: [50, 'University ID must be at most 50 characters.'],
        },
        profileImage: {
            type: String, // URL or filename
            default: '',
        },

        // ── Fitbit integration ──────────────────────────────────────────────────
        fitbitAccessToken: { type: String, default: null },
        fitbitRefreshToken: { type: String, default: null },
        fitbitUserId: { type: String, default: null },

        // ── Notification preferences ─────────────────────────────────────────────
        emailEnabled: { type: Boolean, default: true },
        smsEnabled: { type: Boolean, default: false },
        phoneNumber: { 
            type: String, 
            default: '',
            validate: {
                validator: function(v) {
                    // Allow empty string, or generic international/national format: +[digits] or 0[digits], 7-15 chars
                    return v === '' || /^\+?[0-9]{7,15}$/.test(v);
                },
                message: 'Please enter a valid phone number (e.g., +1234567890).'
            }
        },

        // ── Activity log ───────────────────────────────────────────────────────
        activityLog: {
            type: [activityLogSchema],
            default: [],
        },
    },
    {
        timestamps: true, // adds createdAt + updatedAt
        toJSON: {
            transform: (_doc, ret) => {
                delete ret.password;
                delete ret.__v;
                return ret;
            },
        },
    }
);

// ── Hooks ──────────────────────────────────────────────────────────────────────
// Hash password before save (only when modified)
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    next();
});

// ── Instance methods ───────────────────────────────────────────────────────────
/**
 * Compare a plain-text candidate against the stored hash.
 * @param {string} candidate
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidate) {
    return bcrypt.compare(candidate, this.password);
};

/**
 * Push an entry to the activity log (max 50 entries, FIFO).
 */
userSchema.methods.logActivity = async function (action, details = '', ip = '') {
    this.activityLog.push({ action, details, ip });
    if (this.activityLog.length > 50) {
        this.activityLog = this.activityLog.slice(-50);
    }
    await this.save();
};

module.exports = mongoose.model('User', userSchema);
