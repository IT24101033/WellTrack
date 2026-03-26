'use strict';

const Notification = require('../models/notificationModel');
const User = require('../models/User');
const { sendEmail, sendSMS, sendAppAlert } = require('../utils/notificationService');

const ok = (res, data, status = 200) => res.status(status).json({ success: true, ...data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });

// POST /api/notifications  (admin only — creates system or targeted notifications)
const createNotification = async (req, res) => {
    try {
        const { userId, title, message, type } = req.body;
        if (!userId || !title || !message) {
            return fail(res, 'userId, title, and message are required.', 400);
        }
        const notification = await Notification.create({ userId, title, message, type: type || 'system' });
        return ok(res, { notification }, 201);
    } catch (err) {
        console.error('[createNotification]', err);
        return fail(res, 'Failed to create notification.', 500);
    }
};

// POST /api/notifications/broadcast  (admin only — creates system notifications for all users)
const broadcastNotification = async (req, res) => {
    try {
        const { title, message, type } = req.body;
        if (!title || !message) {
            return fail(res, 'title and message are required.', 400);
        }
        const users = await User.find({ role: 'student', isActive: true });
        
        let sentCount = 0;
        for (const user of users) {
             await sendAppAlert(user._id, title, message, type || 'system');
             sentCount++;
        }

        return ok(res, { message: `Broadcast sent to ${sentCount} users.` }, 201);
    } catch (err) {
        console.error('[broadcastNotification]', err);
        return fail(res, 'Failed to broadcast notification.', 500);
    }
};

// GET /api/notifications  (own — supports ?type=&status= filter)
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const filter = { userId };
        if (req.query.type) filter.type = req.query.type;
        if (req.query.status) filter.status = req.query.status;

        const notifications = await Notification.find(filter).sort({ createdAt: -1 });
        const unreadCount = await Notification.countDocuments({ userId, status: 'unread' });
        return ok(res, { notifications, unreadCount });
    } catch (err) {
        console.error('[getNotifications]', err);
        return fail(res, 'Failed to fetch notifications.', 500);
    }
};

// PUT /api/notifications/:id  (mark as read)
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { $set: { status: 'read' } },
            { new: true }
        );
        if (!notification) return fail(res, 'Notification not found.', 404);
        return ok(res, { notification });
    } catch (err) {
        console.error('[markAsRead]', err);
        return fail(res, 'Failed to update notification.', 500);
    }
};

// PUT /api/notifications/read-all  (mark ALL as read)
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ userId: req.user.id, status: 'unread' }, { $set: { status: 'read' } });
        return ok(res, { message: 'All notifications marked as read.' });
    } catch (err) {
        console.error('[markAllAsRead]', err);
        return fail(res, 'Failed to update notifications.', 500);
    }
};

// DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!notification) return fail(res, 'Notification not found.', 404);
        return ok(res, { message: 'Notification deleted.' });
    } catch (err) {
        console.error('[deleteNotification]', err);
        return fail(res, 'Failed to delete notification.', 500);
    }
};

// DELETE /api/notifications  (delete all own)
const clearAllNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({ userId: req.user.id });
        return ok(res, { message: 'All notifications cleared.' });
    } catch (err) {
        console.error('[clearAllNotifications]', err);
        return fail(res, 'Failed to clear notifications.', 500);
    }
};

// POST /api/notifications/test-feature (send test email and sms)
const testFeature = async (req, res) => {
    try {
        const { email, phone } = req.body;
        
        // If not provided, we can fallback to req.user's email/phone if we had them populated, 
        // but since we want an explicit test, we'll try to send to whatever is passed.
        // For testing, we ensure we return the status of the send.
        
        let emailResult = false;
        let smsResult = false;
        let messages = [];
        
        if (email) {
            emailResult = await sendEmail(email, 'WellTrack Test Email', 'This is a test email sent from the WellTrack feature test.');
            messages.push(emailResult ? 'Email sent successfully.' : 'Failed to send email.');
        } else {
            messages.push('No email provided for test.');
        }

        if (phone) {
            smsResult = await sendSMS(phone, 'This is a test SMS sent from the WellTrack feature test.');
            messages.push(smsResult ? 'SMS sent successfully.' : 'Failed to send SMS.');
        } else {
            messages.push('No phone provided for test.');
        }
        
        return ok(res, { message: messages.join(' '), emailResult, smsResult });
    } catch (err) {
        console.error('[testFeature]', err);
        return fail(res, 'Failed to process test notifications.', 500);
    }
};

module.exports = {
    createNotification,
    broadcastNotification,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    testFeature,
};
