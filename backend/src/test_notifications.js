const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { sendEmail, sendSMS } = require('./utils/notificationService');

async function test() {
    console.log('--- Notification Diagnostic ---');
    console.log('User:', process.env.EMAIL_USER);
    
    // Test Email
    console.log('\nTesting Email...');
    const e = await sendEmail('vibodhasilvaulindu@gmail.com', 'Diagnostic', 'Test message');
    console.log('Email result:', e ? 'SUCCESS' : 'FAILED');

    // Test SMS with E.164 normalization
    console.log('\nTesting SMS (with +94 normalization)...');
    const s = await sendSMS('+94787127717', 'HealthPredict Diagnostic: PIN fix verified.');
    console.log('SMS result:', s ? 'SUCCESS' : 'FAILED');
}

test().catch(console.error);
