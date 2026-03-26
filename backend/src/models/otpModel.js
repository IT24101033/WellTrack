'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        otpHash: {
            type: String,
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 600, // Document automatically expires after 10 minutes (600 seconds)
        },
    }
);

/**
 * Compare a plain-text OTP against the stored hash.
 */
otpSchema.methods.compareOtp = async function (candidate) {
    return bcrypt.compare(candidate, this.otpHash);
};

module.exports = mongoose.model('Otp', otpSchema);
