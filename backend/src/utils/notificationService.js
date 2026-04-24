'use strict';

const nodemailer = require('nodemailer');
const twilio = require('twilio');
const Notification = require('../models/notificationModel');
const User = require('../models/User');
const Preference = require('../models/preferenceModel');

/**
 * sendEmail
 * Sends an email using Nodemailer.
 * 
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise<boolean>}
 */
const sendEmail = async (to, subject, text) => {
    try {
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;
        if (!user || user === 'your_email@gmail.com' || !pass || pass === 'your_gmail_app_password') {
            console.log('\x1b[33m%s\x1b[0m', '[EmailService] Skip: Missing credentials in .env');
            return true; 
        }

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: { user, pass },
            tls: { rejectUnauthorized: false }
        });

        await transporter.sendMail({ from: `"WellTrack" <${user}>`, to, subject, text });
        console.log('\x1b[32m%s\x1b[0m', `[EmailService] Sent to: ${to}`);
        return true;
    } catch (err) {
        console.error('\x1b[31m%s\x1b[0m', '[EmailService] Error:', err.message);
        return false;
    }
};

/**
 * sendSMS
 * Sends an SMS using Twilio.
 * 
 * @param {string} to
 * @param {string} body
 * @returns {Promise<boolean>}
 */
const sendSMS = async (to, body) => {
    try {
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const auth = process.env.TWILIO_AUTH_TOKEN;
        const phone = process.env.TWILIO_PHONE_NUMBER;

        if (!sid || sid === 'your_twilio_sid' || !auth || auth === 'your_twilio_auth_token' || !phone) {
            console.log('\x1b[33m%s\x1b[0m', '[SMSService] Skip: Missing Twilio credentials in .env');
            return true;
        }

        const client = twilio(sid, auth);
        const message = await client.messages.create({ body, from: phone, to });
        console.log('\x1b[32m%s\x1b[0m', `[SMSService] Sent to ${to}. SID: ${message.sid}`);
        return true;
    } catch (err) {
        console.error('\x1b[31m%s\x1b[0m', '[SMSService] Error:', err.message);
        if (err.message.includes('not verified')) {
            console.error('\x1b[33m%s\x1b[0m', 'TIP: Verify the destination number in Twilio Console if using a Trial Account.');
        }
        return false;
    }
};

/**
 * sendAppAlert
 * Creates an in-app notification and dispatches Email/SMS based on User Preferences.
 *
 * @param {string} userId
 * @param {string} title
 * @param {string} message
 * @param {string} type ('system', 'wellness', 'appointment', 'medication')
 */
const sendAppAlert = async (userId, title, message, type = 'system') => {
    try {
        // 1. Create in-app Notification
        await Notification.create({ userId, title, message, type, status: 'unread' });

        // 2. Fetch User & Preference
        const user = await User.findById(userId);
        if (!user) return;

        let pref = await Preference.findOne({ userId });
        if (!pref) pref = { emailNotifications: true, smsAlerts: false }; // defaults

        // 3. Send Email
        if (pref.emailNotifications && user.email) {
            await sendEmail(user.email, title, message);
        }

        // 4. Send SMS
        if (pref.smsAlerts && user.phoneNumber) {
            await sendSMS(user.phoneNumber, message);
        }
    } catch (err) {
        console.error('[notificationService.sendAppAlert] Error:', err);
    }
};

module.exports = {
    sendEmail,
    sendSMS,
    sendAppAlert
};
