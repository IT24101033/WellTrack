'use strict';

const { generateHealthInsight, getYouTubeVideo } = require('../utils/aiService');
const LifestyleTip = require('../models/lifestyleTipModel');
const User = require('../models/User');

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
            data: {
                insight,
                videoUrl
            }
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    generateInsightForTip
};
