'use strict';

/**
 * utils/reminderScheduler.js
 * node-cron job that fires every minute, finds due reminders,
 * creates Notification documents, and marks reminders as sent.
 */

const cron = require('node-cron');
const Reminder = require('../models/reminderModel');
const { sendAppAlert } = require('./notificationService');

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

        // Process each reminder individually to handle notifications
        for (const reminder of dueReminders) {
            const title = `⏰ Reminder: ${reminder.activityTitle || 'Activity starting soon'}`;
            const message = `Your ${reminder.activityCategory || ''} activity "${reminder.activityTitle || ''}" is starting soon!`;

            // Delegate to the central app alert helper
            await sendAppAlert(reminder.userId, title, message, 'wellness');

            // Mark as sent
            reminder.isSent = true;
            await reminder.save();
        }

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
