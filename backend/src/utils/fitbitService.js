'use strict';

const axios = require('axios');
const User = require('../models/User');

/**
 * generateAuthUrl
 * Generates the Fitbit OAuth2 authorization URL.
 * 
 * @returns {string}
 */
const generateAuthUrl = () => {
    const clientId = process.env.FITBIT_CLIENT_ID;
    const redirectUri = process.env.FITBIT_REDIRECT_URI;
    const scope = 'activity heartrate location nutrition profile settings sleep social weight';

    if (!clientId || clientId === 'your_fitbit_client_id') {
        return null;
    }

    return `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&expires_in=604800`;
};

/**
 * exchangeCodeForTokens
 * Exchanges the OAuth2 authorization code for access and refresh tokens.
 * 
 * @param {string} code
 * @returns {Promise<object>}
 */
const exchangeCodeForTokens = async (code) => {
    const clientId = process.env.FITBIT_CLIENT_ID;
    const clientSecret = process.env.FITBIT_CLIENT_SECRET;
    const redirectUri = process.env.FITBIT_REDIRECT_URI;

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const params = new URLSearchParams();
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('client_id', clientId);
    params.append('redirect_uri', redirectUri);

    const response = await axios.post('https://api.fitbit.com/oauth2/token', params, {
        headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    return response.data;
};

/**
 * refreshTokens
 * Refreshes the Fitbit OAuth2 access token using the refresh token.
 * 
 * @param {string} refreshToken
 * @returns {Promise<object>}
 */
const refreshTokens = async (refreshToken) => {
    const clientId = process.env.FITBIT_CLIENT_ID;
    const clientSecret = process.env.FITBIT_CLIENT_SECRET;

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);

    const response = await axios.post('https://api.fitbit.com/oauth2/token', params, {
        headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    return response.data;
};

/**
 * fetchFitbitData
 * Fetches health data from Fitbit using a valid access token.
 * 
 * @param {string} accessToken
 * @param {string} endpoint (e.g., 'activities/heart/date/today/1d.json')
 * @returns {Promise<object>}
 */
const fetchFitbitData = async (accessToken, endpoint) => {
    const response = await axios.get(`https://api.fitbit.com/1/user/-/${endpoint}`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    return response.data;
};

module.exports = {
    generateAuthUrl,
    exchangeCodeForTokens,
    refreshTokens,
    fetchFitbitData
};
