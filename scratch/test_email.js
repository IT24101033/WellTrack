'use strict';

const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const testEmail = async () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    
    console.log(`Using user: ${user}`);
    console.log(`Using pass: ${pass ? '****' : 'MISSING'}`);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: user,
            pass: pass
        }
    });

    try {
        console.log('Attempting to send test email...');
        const info = await transporter.sendMail({
            from: user,
            to: user, // send to self
            subject: 'WellTrack Test Email',
            text: 'If you receive this, your email configuration is working!'
        });
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (err) {
        console.error('❌ Email failed:', err);
    }
};

testEmail();
