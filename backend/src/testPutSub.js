const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'c:\\SLIIT\\Y2S2\\AIML Project\\Git\\smart-health-risk-predictor\\backend\\.env' });

const token = jwt.sign({ id: '64e622b8214f48ff3c70f031', role: 'user' }, process.env.JWT_SECRET || 'fallbacksecret');

fetch('http://localhost:5000/api/subscription', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ planName: 'Premium' })
})
    .then(res => res.json())
    .then(console.log)
    .catch(console.error);
