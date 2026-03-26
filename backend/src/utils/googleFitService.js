'use strict';

const axios = require('axios');

/**
 * googleFitService
 * Service for interacting with Google Fitness API.
 * 
 * Note: Frontend currently uses Implicit Flow for simplicity.
 * This service can be expanded for server-side token exchange if needed.
 */

const validateToken = async (accessToken) => {
    try {
        const response = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`);
        return response.data;
    } catch (err) {
        console.error('[googleFitService.validateToken]', err.message);
        return null;
    }
};

/**
 * fetchGoogleFitData
 * Generic helper to fetch data from fitness api
 */
const fetchGoogleFitData = async (accessToken, endpoint, method = 'GET', data = null) => {
    try {
        const config = {
            method,
            url: `https://www.googleapis.com/fitness/v1/users/me/${endpoint}`,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        };
        if (data) config.data = data;

        const response = await axios(config);
        return response.data;
    } catch (err) {
        console.error(`[googleFitService.fetchGoogleFitData] ${endpoint}`, err.response?.data || err.message);
        throw err;
    }
};

module.exports = {
    validateToken,
    fetchGoogleFitData
};
