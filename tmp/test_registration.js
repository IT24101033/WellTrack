const axios = require('axios');

async function testRegistration() {
    const payload = {
        fullName: 'Test User',
        email: 'test' + Date.now() + '@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'student'
    };

    console.log('Testing Registration with payload:', payload);

    try {
        const res = await axios.post('http://localhost:5000/api/users/register', payload);
        console.log('Registration SUCCESS:', res.data);
    } catch (err) {
        if (err.response) {
            console.error('Registration FAILED (Response):', err.response.status, err.response.data);
        } else {
            console.error('Registration FAILED (No Response):', err.message);
        }
    }
}

testRegistration();
