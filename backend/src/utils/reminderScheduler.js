'use strict';

/**
 * utils/reminderScheduler.js
 * node-cron job that fires every minute, finds due reminders,
 * creates Notification documents, and marks reminders as sent.
 */

const cron = require('node-cron');
const Reminder = require('../models/reminderModel');
const Notification = require('../models/notificationModel');

const CATEGORY_LABELS = {
    Workout: 'workout',
    Study: 'study',
    Sleep: 'sleep',
    Meal: 'meal',
    Break: 'break',
};

const processReminders = async () => {
    try {
        const now = new Date();

        // Find all unsent reminders whose trigger time has passed (or is now)
        const dueReminders = await Reminder.find({
            isSent: false,
            triggerTime: { $lte: now },
        });

        if (dueReminders.length === 0) return;

        // Create notification documents for each due reminder
        const notifications = dueReminders.map((reminder) => ({
            userId: reminder.userId,
            title: `⏰ Reminder: ${reminder.activityTitle || 'Activity starting soon'}`,
            message: `Your ${reminder.activityCategory || ''} activity "${reminder.activityTitle || ''}" is starting soon!`,
            type: 'wellness',
            status: 'unread',
        }));

        await Notification.insertMany(notifications);

        // Mark all as sent
        const ids = dueReminders.map((r) => r._id);
        await Reminder.updateMany({ _id: { $in: ids } }, { isSent: true });

        console.log(`[ReminderScheduler] Processed ${dueReminders.length} reminder(s).`);
    } catch (err) {
        console.error('[ReminderScheduler] Error during processing:', err);
    }
};

/**
 * startReminderScheduler
 * Call once at server startup. Runs every minute.
 */
const startReminderScheduler = () => {
    // Run every minute
    cron.schedule('* * * * *', processReminders);
    console.log('[ReminderScheduler] Started — checking every minute.');
};

module.exports = { startReminderScheduler };
