'use strict';

const { generateHealthInsight, generateHealthAdvice, getYouTubeVideo, getYouTubeVideos } = require('../utils/aiService');
const LifestyleTip = require('../models/lifestyleTipModel');
const User = require('../models/User');
const StudentHealth = require('../models/studentHealthModel');

/**
 * generateInsightForTip
 * POST /api/ai/tips/:id/generate-insight
 */
const generateInsightForTip = async (req, res, next) => {
    try {
        const { id } = req.params;
        const tip = await LifestyleTip.findById(id);
        if (!tip) return res.status(404).json({ success: false, message: 'Tip not found' });

        const user = await User.findById(req.user.id);

        const insight = await generateHealthInsight(tip.title, tip.description, {
            age: user?.age,
            weight: user?.weight
        });

        const videoUrl = await getYouTubeVideo(tip.title);

        // Update the tip with these insights for caching
        tip.ai_insights = insight;
        tip.youtube_url = videoUrl;
        await tip.save();

        res.status(200).json({
            success: true,
            data: { insight, videoUrl }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * getHealthAdvice
 * POST /api/ai/health-advice
 *
 * Uses the user's recent health data to generate personalized AI advice
 * across Diet, Workout, and Mental Wellness categories, plus YouTube videos.
 */
const getHealthAdvice = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Get the most recent health record for context
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const fromDate = thirtyDaysAgo.toISOString().slice(0, 10);

        const entries = await StudentHealth.find({ userId, date: { $gte: fromDate } })
            .sort({ date: -1 })
            .limit(10);

        // Build user context from recent records
        const avg = (arr, fn) => {
            const vals = arr.map(fn).filter(v => v != null);
            return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
        };

        const userContext = {
            healthScore: avg(entries, e => e.healthScore),
            sleepHours: avg(entries, e => e.physiological?.sleepHours),
            stressScore: avg(entries, e => e.psychological?.stressScore),
            stepsPerDay: avg(entries, e => e.activity?.stepsPerDay),
        };

        // Generate AI advice (Gemini)
        const advice = await generateHealthAdvice(userContext);

        // Generate YouTube video recommendations
        let queryParts = ['healthy lifestyle'];
        if (userContext.stressScore && userContext.stressScore > 5) queryParts.push('stress relief');
        if (userContext.sleepHours && userContext.sleepHours < 7) queryParts.push('better sleep');
        if (userContext.stepsPerDay && userContext.stepsPerDay < 5000) queryParts.push('beginner workout');
        else queryParts.push('workout diet');
        
        const randomKeywords = ['tips', 'routine', 'habits', 'motivation', 'ideas'];
        queryParts.push(randomKeywords[Math.floor(Math.random() * randomKeywords.length)]);
        
        const videoQuery = queryParts.join(' ');
        const videos = await getYouTubeVideos(videoQuery, 5);

        res.status(200).json({
            success: true,
            data: {
                advice,
                videos,
                userContext,
                poweredBy: 'Google Gemini',
            }
        });
    } catch (err) {
        console.error('[getHealthAdvice]', err);
        next(err);
    }
};

module.exports = {
    generateInsightForTip,
    getHealthAdvice,
};
