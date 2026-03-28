const axios = require('axios');

async function verifyAuth() {
    const baseURL = 'http://localhost:5000/api';
    const uniqueEmail = `test_${Date.now()}@example.com`;
    
    console.log('--- Auth Verification Diagnostic ---');
    console.log(`Targeting: ${baseURL}`);
    
    // 1. Test Registration
    console.log('\n[1/2] Testing student registration...');
    const regData = {
        fullName: 'Test Auditor',
        email: uniqueEmail,
        password: 'password123',
        confirmPassword: 'password123',
        role: 'student'
    };
    
    try {
        const regRes = await axios.post(`${baseURL}/users/register`, regData);
        console.log('>> Registration SUCCESS:', regRes.data.message || 'Account created');
        
        // 2. Test Login
        console.log('\n[2/2] Testing login with new credentials...');
        const loginData = { email: uniqueEmail, password: 'password123' };
        const loginRes = await axios.post(`${baseURL}/users/login`, loginData);
        console.log('>> Login SUCCESS: Received token for', loginRes.data.user.email);
        
    } catch (err) {
        if (err.response) {
            console.error('>> ERROR (Response):', err.response.status, JSON.stringify(err.response.data, null, 2));
        } else {
            console.error('>> CRASH (No Response):', err.message);
        }
    }
}

verifyAuth();
