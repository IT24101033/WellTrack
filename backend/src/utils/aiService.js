'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * generateHealthInsight
 * Uses Gemini Pro to generate a concise, personalized insight based on tip context and user stats.
 * 
 * @param {string} tipTitle
 * @param {string} tipDescription
 * @param {object} userStats (optional)
 * @returns {Promise<string>}
 */
const generateHealthInsight = async (tipTitle, tipDescription, userStats = {}) => {
    try {
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            return "AI Insights are currently unavailable (missing API key).";
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
            You are a health and wellness assistant.
            Give a concise (2-3 sentences), encouraging insight for a wellness tip.
            Tip: ${tipTitle}
            Description: ${tipDescription}
            ${userStats.age ? `User Age: ${userStats.age}` : ''}
            ${userStats.weight ? `User Weight: ${userStats.weight}kg` : ''}
            
            Keep the tone professional yet friendly. Avoid medical jargon.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (err) {
        console.error('[aiService.generateHealthInsight]', err);
        return "Unable to generate AI insight at this time.";
    }
};

/**
 * getYouTubeVideo
 * Searched for a relevant YouTube video link based on the tip title.
 * 
 * @param {string} query
 * @returns {Promise<string>} (YouTube URL)
 */
const getYouTubeVideo = async (query) => {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey || apiKey === 'your_youtube_api_key_here') {
            // Fallback to a generic YouTube search link if no API key is provided
            return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        }

        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: query,
                maxResults: 1,
                type: 'video',
                key: apiKey
            }
        });

        const video = response.data.items[0];
        if (video) {
            return `https://www.youtube.com/watch?v=${video.id.videoId}`;
        }
        
        return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    } catch (err) {
        console.error('[aiService.getYouTubeVideo]', err);
        return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    }
};

module.exports = {
    generateHealthInsight,
    getYouTubeVideo
};
