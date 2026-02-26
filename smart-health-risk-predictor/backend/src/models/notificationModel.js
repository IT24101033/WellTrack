'use strict';

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
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
        message: {
            type: String,
            required: [true, 'Message is required'],
            trim: true,
            maxlength: 1000,
        },
        type: {
            type: String,
            enum: ['appointment', 'medication', 'wellness', 'system'],
            default: 'system',
        },
        status: {
            type: String,
            enum: ['read', 'unread'],
            default: 'unread',
        },
        autoDeleteDate: {
            type: Date,
            default: () => {
                const d = new Date();
                d.setDate(d.getDate() + 30); // auto-delete after 30 days
                return d;
            },
        },
    },
    { timestamps: true, versionKey: false }
);

// TTL index — MongoDB deletes documents after autoDeleteDate
notificationSchema.index({ autoDeleteDate: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Notification', notificationSchema);
