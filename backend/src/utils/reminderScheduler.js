'use strict';

/**
 * utils/reminderScheduler.js
 * node-cron job that fires every minute, finds due reminders,
 * creates Notification documents, and marks reminders as sent.
 */

const cron = require('node-cron');
const Reminder = require('../models/reminderModel');
const Notification = require('../models/notificationModel');
const User = require('../models/User');
const { sendEmail, sendSMS } = require('./notificationService');

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
            const user = await User.findById(reminder.userId);
            const title = `⏰ Reminder: ${reminder.activityTitle || 'Activity starting soon'}`;
            const message = `Your ${reminder.activityCategory || ''} activity "${reminder.activityTitle || ''}" is starting soon!`;

            // 1. In-app notification
            await Notification.create({
                userId: reminder.userId,
                title,
                message,
                type: 'wellness',
                status: 'unread',
            });

            // 2. Email notification (if enabled)
            if (user?.emailEnabled && user?.email) {
                await sendEmail(user.email, title, message);
            }

            // 3. SMS notification (if enabled)
            if (user?.smsEnabled && user?.phoneNumber) {
                await sendSMS(user.phoneNumber, message);
            }

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
