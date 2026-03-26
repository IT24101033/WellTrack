'use strict';

/**
 * controllers/reminderController.js
 * Manages reminders for frontend polling & manual cancellation.
 */

const Reminder = require('../models/reminderModel');

// ── GET — upcoming/pending reminders for the authenticated user ───────────────
exports.getUserReminders = async (req, res) => {
    try {
        // Return unacknowledged reminders that triggered in the last 15 minutes, or will trigger in the next 2 hours
        const now = new Date();
        const horizonEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const horizonStart = new Date(now.getTime() - 15 * 60 * 1000);

        const reminders = await Reminder.find({
            userId: req.user.id,
            isAcknowledged: false,
            triggerTime: { $gte: horizonStart, $lte: horizonEnd },
        }).sort({ triggerTime: 1 });

        res.json({ success: true, data: reminders });
    } catch (err) {
        console.error('[reminderController.getUserReminders]', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── POST — manually create a reminder (standalone, not tied to activity) ──────
exports.createReminder = async (req, res) => {
    try {
        const { activityId, triggerTime, activityTitle, activityCategory } = req.body;

        if (!triggerTime) {
            return res.status(400).json({ success: false, message: 'triggerTime is required.' });
        }

        const reminder = await Reminder.create({
            activityId: activityId || null,
            userId: req.user.id,
            triggerTime: new Date(triggerTime),
            activityTitle,
            activityCategory,
            isSent: false,
            isAcknowledged: false,
        });

        res.status(201).json({ success: true, data: reminder });
    } catch (err) {
        console.error('[reminderController.createReminder]', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── DELETE — cancel a reminder ────────────────────────────────────────────────
exports.deleteReminder = async (req, res) => {
    try {
        const reminder = await Reminder.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id,
        });
        if (!reminder) {
            return res.status(404).json({ success: false, message: 'Reminder not found.' });
        }
        res.json({ success: true, message: 'Reminder cancelled.' });
    } catch (err) {
        console.error('[reminderController.deleteReminder]', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── PATCH — mark reminder as acknowledged by client ───────────────────────────
exports.acknowledgeReminder = async (req, res) => {
    try {
        const reminder = await Reminder.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { isAcknowledged: true },
            { new: true }
        );
        if (!reminder) {
            return res.status(404).json({ success: false, message: 'Reminder not found.' });
        }
        res.json({ success: true, data: reminder });
    } catch (err) {
        console.error('[reminderController.acknowledgeReminder]', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};
