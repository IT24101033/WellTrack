'use strict';

const nodemailer = require('nodemailer');
const twilio = require('twilio');

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
            console.log('[notificationService.sendEmail] Skip: Missing credentials.');
            console.log(`[DEBUG_EMAIL] To: ${to}, Subject: ${subject}, Body: ${text}`);
            return true; // Pretend it sent
        }

        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: { user, pass }
        });

        await transporter.sendMail({ from: user, to, subject, text });
        console.log(`[notificationService.sendEmail] Email sent to: ${to}`);
        return true;
    } catch (err) {
        console.error('[notificationService.sendEmail] Error:', err);
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
            console.log('[notificationService.sendSMS] Skip: Missing Twilio credentials.');
            console.log(`[DEBUG_SMS] To: ${to}, Body: ${body}`);
            return true; // Pretend it sent
        }

        const client = twilio(sid, auth);
        await client.messages.create({ body, from: phone, to });
        console.log(`[notificationService.sendSMS] SMS sent to: ${to}`);
        return true;
    } catch (err) {
        console.error('[notificationService.sendSMS] Error:', err);
        return false;
    }
};

module.exports = {
    sendEmail,
    sendSMS
};
