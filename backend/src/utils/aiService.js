'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * generateHealthInsight
 * Uses Gemini to generate a concise, personalized insight based on tip context.
 */
const generateHealthInsight = async (tipTitle, tipDescription, userStats = {}) => {
    try {
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            return "AI Insights are currently unavailable (missing API key).";
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
 * generateHealthAdvice
 * Uses Gemini to generate personalized health advice across three categories.
 * Returns an object: { diet, workout, mental }
 */
const generateHealthAdvice = async (userContext = {}) => {
    const noKey = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here';

    if (noKey) {
        return {
            diet: "Maintain a balanced diet with lean proteins, whole grains, and colorful vegetables. Aim for 5 servings of fruits and vegetables daily.",
            diet_plans: [],
            workout: "Start with a 20-minute brisk walk each morning. Gradually increase to 10,000 steps per day. Try bodyweight exercises like squats and push-ups at home.",
            workout_plans: [],
            mental: "Keep up healthy mental habits! Consider journaling your daily accomplishments. Schedule regular social activities to maintain emotional wellbeing.",
        };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

        const contextStr = userContext.healthScore
            ? `The user's current health score is ${userContext.healthScore}/100.`
            : '';
        const sleepStr = userContext.sleepHours
            ? `They average ${userContext.sleepHours}h of sleep per night.`
            : '';
        const stressStr = userContext.stressScore
            ? `Their stress score is ${userContext.stressScore}/10.`
            : '';
        const stepsStr = userContext.stepsPerDay
            ? `They walk approximately ${userContext.stepsPerDay} steps per day.`
            : '';

        const prompt = `
You are an expert health and wellness coach. Based on the following user data, provide highly detailed, step-by-step advice, along with a full-day diet plan and a comprehensive daily workout routine.
${contextStr} ${sleepStr} ${stressStr} ${stepsStr}

Respond ONLY with valid JSON (no markdown, no backticks, no comments) in this exact format:
{
  "diet": "A supportive opening paragraph about their nutrition.",
  "diet_plans": [
    { "title": "Full-Day Meal Plan", "description": "Breakfast: [Detailed meal]. Snack: [Detailed]. Lunch: [Detailed]. Dinner: [Detailed]. Explain why these foods help.", "recommended_time": "All Day", "difficulty_level": "Medium", "target_type": "Nutrition" },
    { "title": "Hydration & Supplements", "description": "Specific timings for water intake and recommended vitamins based on their profile.", "recommended_time": "08:00 AM", "difficulty_level": "Easy", "target_type": "Nutrition" }
  ],
  "workout": "An encouraging paragraph about their fitness journey.",
  "workout_plans": [
    { "title": "Step-by-Step Daily Workout", "description": "Warmup: 5 mins... Main Workout (Step 1, Step 2, Step 3, with reps and sets)... Cooldown: 5 mins stretch. Detail everything clearly.", "recommended_time": "07:00 AM", "duration": "45 mins", "difficulty_level": "Medium", "target_type": "Fitness" },
    { "title": "Active Recovery / Evening Mobility", "description": "Light stretching or Yoga routine step-by-step to improve flexibility and sleep.", "recommended_time": "08:00 PM", "duration": "15 mins", "difficulty_level": "Easy", "target_type": "Fitness" }
  ],
  "mental": "2-3 sentences of overall mental wellness advice, plus a specific activity they can do today."
}
Ensure your descriptions are thorough and well-explained. DO NOT include any formatting outside the JSON object.
        `;

        const result = await model.generateContent(prompt);
        const text = (await result.response).text().trim();

        // Strip markdown code fences if present
        const clean = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(clean);
        return {
            diet: parsed.diet || '',
            diet_plans: parsed.diet_plans || [],
            workout: parsed.workout || '',
            workout_plans: parsed.workout_plans || [],
            mental: parsed.mental || '',
        };
    } catch (err) {
        console.error('[aiService.generateHealthAdvice]', err);
        return {
            diet: "Maintain a balanced diet with lean proteins, whole grains, and colorful vegetables. Stay hydrated with at least 2 liters of water daily.",
            diet_plans: [],
            workout: "Aim for at least 30 minutes of moderate exercise daily. Walking, cycling, or yoga are great starting points for building a consistent routine.",
            workout_plans: [],
            mental: "Practice mindfulness for 5–10 minutes each morning. Connect with friends and loved ones regularly to maintain emotional wellbeing.",
        };
    }
};

/**
 * getYouTubeVideo
 * Searches for a relevant YouTube video based on the tip title.
 */
const getYouTubeVideo = async (query) => {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey || apiKey === 'your_youtube_api_key_here') {
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

/**
 * getYouTubeVideos
 * Searches for multiple relevant YouTube videos.
 * Returns an array of { videoId, title, thumbnail, channelTitle, url }
 */
const getYouTubeVideos = async (query, maxResults = 5) => {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey || apiKey === 'your_youtube_api_key_here') {
            // Return placeholder data when no API key
            return [];
        }

        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: query,
                maxResults,
                type: 'video',
                key: apiKey,
                relevanceLanguage: 'en',
                safeSearch: 'strict',
            }
        });

        return (response.data.items || []).map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
            channelTitle: item.snippet.channelTitle,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        }));
    } catch (err) {
        console.error('[aiService.getYouTubeVideos]', err);
        return [];
    }
};

module.exports = {
    generateHealthInsight,
    generateHealthAdvice,
    getYouTubeVideo,
    getYouTubeVideos,
};
