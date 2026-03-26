'use strict';

/**
 * controllers/activityController.js
 * CRUD + status management for user activities.
 */

const Activity = require('../models/activityModel');
const Reminder = require('../models/reminderModel');

// ── Helper: compute reminder triggerTime ──────────────────────────────────────
const computeTriggerTime = (date, startTime, minutesBefore) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const activityStart = new Date(date);
    activityStart.setHours(hours, minutes, 0, 0);
    return new Date(activityStart.getTime() - minutesBefore * 60 * 1000);
};

// ── Helper: upsert reminder for an activity ───────────────────────────────────
const syncReminder = async (activity) => {
    // Remove any existing unsent reminder for this activity
    await Reminder.deleteMany({ activityId: activity._id, isSent: false });

    if (activity.reminderEnabled && activity.reminderTimeBefore >= 0) {
        const triggerTime = computeTriggerTime(
            activity.date,
            activity.startTime,
            activity.reminderTimeBefore
        );
        // Only schedule if trigger is in the future
        if (triggerTime > new Date()) {
            await Reminder.create({
                activityId: activity._id,
                userId: activity.userId,
                triggerTime,
                isSent: false,
                activityTitle: activity.title,
                activityCategory: activity.category,
            });
        }
    }
};

// ── CREATE ────────────────────────────────────────────────────────────────────
exports.createActivity = async (req, res) => {
    try {
        const {
            title, description, category, date,
            startTime, endTime, status,
            reminderEnabled, reminderTimeBefore,
        } = req.body;

        const activity = await Activity.create({
            userId: req.user.id,
            title,
            description,
            category,
            date: new Date(date),
            startTime,
            endTime,
            status: status || 'Pending',
            reminderEnabled: !!reminderEnabled,
            reminderTimeBefore: reminderTimeBefore ?? 15,
        });

        await syncReminder(activity);

        res.status(201).json({ success: true, data: activity });
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        console.error('[activityController.createActivity]', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── READ ALL ──────────────────────────────────────────────────────────────────
exports.getActivities = async (req, res) => {
    try {
        const filter = { userId: req.user.id };

        if (req.query.date) {
            const day = new Date(req.query.date);
            const nextDay = new Date(day);
            nextDay.setDate(day.getDate() + 1);
            filter.date = { $gte: day, $lt: nextDay };
        }
        if (req.query.category) filter.category = req.query.category;
        if (req.query.status) filter.status = req.query.status;

        // Week range: ?weekStart=YYYY-MM-DD
        if (req.query.weekStart) {
            const start = new Date(req.query.weekStart);
            const end = new Date(start);
            end.setDate(start.getDate() + 7);
            filter.date = { $gte: start, $lt: end };
        }

        const activities = await Activity.find(filter).sort({ date: 1, startTime: 1 });
        res.json({ success: true, data: activities });
    } catch (err) {
        console.error('[activityController.getActivities]', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── READ ONE ──────────────────────────────────────────────────────────────────
exports.getActivity = async (req, res) => {
    try {
        const activity = await Activity.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });
        if (!activity) {
            return res.status(404).json({ success: false, message: 'Activity not found.' });
        }
        res.json({ success: true, data: activity });
    } catch (err) {
        console.error('[activityController.getActivity]', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── UPDATE ────────────────────────────────────────────────────────────────────
exports.updateActivity = async (req, res) => {
    try {
        const activity = await Activity.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });
        if (!activity) {
            return res.status(404).json({ success: false, message: 'Activity not found.' });
        }

        const fields = [
            'title', 'description', 'category', 'date',
            'startTime', 'endTime', 'status', 'reminderEnabled', 'reminderTimeBefore',
        ];
        fields.forEach((f) => {
            if (req.body[f] !== undefined) {
                activity[f] = f === 'date' ? new Date(req.body[f]) : req.body[f];
            }
        });

        await activity.save();
        await syncReminder(activity);

        res.json({ success: true, data: activity });
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        console.error('[activityController.updateActivity]', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── PATCH STATUS ──────────────────────────────────────────────────────────────
exports.patchStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Pending', 'Completed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value.' });
        }

        const activity = await Activity.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { status },
            { new: true }
        );
        if (!activity) {
            return res.status(404).json({ success: false, message: 'Activity not found.' });
        }

        res.json({ success: true, data: activity });
    } catch (err) {
        console.error('[activityController.patchStatus]', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── DELETE ────────────────────────────────────────────────────────────────────
exports.deleteActivity = async (req, res) => {
    try {
        const activity = await Activity.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id,
        });
        if (!activity) {
            return res.status(404).json({ success: false, message: 'Activity not found.' });
        }

        // Clean up associated reminders
        await Reminder.deleteMany({ activityId: activity._id });

        res.json({ success: true, message: 'Activity deleted.' });
    } catch (err) {
        console.error('[activityController.deleteActivity]', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};
