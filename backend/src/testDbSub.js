const mongoose = require('mongoose');
const Subscription = require('./models/subscriptionModel');
require('dotenv').config({ path: 'c:\\SLIIT\\Y2S2\\AIML Project\\Git\\smart-health-risk-predictor\\backend\\.env' });

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/welltrack', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        try {
            const PLAN_FEATURES = Subscription.schema.statics.PLAN_FEATURES || require('./models/subscriptionModel').PLAN_FEATURES;
            const updateData = {
                planName: 'Premium',
                features: PLAN_FEATURES ? PLAN_FEATURES['Premium'] : [],
                status: 'active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 31536000000), // +1 year
                autoRenew: true
            };
            const sub = await Subscription.findOneAndUpdate(
                { userId: new mongoose.Types.ObjectId() },
                { $set: updateData },
                { new: true, upsert: true }
            );
            console.log("Success:", sub);
        } catch (e) {
            console.error("EXACT ERROR MESSAGE:", e.message);
        }
        process.exit(0);
    });
