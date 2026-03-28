const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// Manually resolve the notification service path
const notificationServicePath = path.join(__dirname, '../backend/src/utils/notificationService.js');
const { sendEmail, sendSMS } = require(notificationServicePath);

async function test() {
    console.log('--- Notification System Diagnostic ---');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('TWILIO_PHONE:', process.env.TWILIO_PHONE_NUMBER);
    
    console.log('\n[1/2] Testing sendEmail to vibodhasilvaulindu@gmail.com...');
    try {
        const emailRes = await sendEmail('vibodhasilvaulindu@gmail.com', 'Diagnostic: Admin PIN Test', 'This is a test from the HealthPredict diagnostic tool.');
        console.log('>> sendEmail Result:', emailRes ? 'SUCCESS' : 'FAILED');
    } catch (err) {
        console.error('>> sendEmail CRASHED:', err.message);
    }

    console.log('\n[2/2] Testing sendSMS to 0787127717...');
    try {
        const smsRes = await sendSMS('0787127717', 'HealthPredict PIN Diagnostic test.');
        console.log('>> sendSMS Result:', smsRes ? 'SUCCESS' : 'FAILED');
    } catch (err) {
        console.error('>> sendSMS CRASHED:', err.message);
    }
}

test().catch(err => {
    console.error('Unexpected Diagnostic Error:', err);
});
