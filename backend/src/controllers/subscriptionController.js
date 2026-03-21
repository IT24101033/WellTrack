'use strict';

const Subscription = require('../models/subscriptionModel');

const ok = (res, data, status = 200) => res.status(status).json({ success: true, ...data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });

// GET /api/subscription  — get own subscription (auto-creates Free plan if none exists)
const getSubscription = async (req, res) => {
    try {
        let subscription = await Subscription.findOne({ userId: req.user.id });
        if (!subscription) {
            // Auto-provision a Free plan on first access
            subscription = await Subscription.create({ userId: req.user.id, planName: 'Free' });
        }
        // Auto-expire check
        if (subscription.status === 'active' && subscription.endDate < new Date()) {
            subscription.status = 'expired';
            await subscription.save();
        }
        return ok(res, { subscription });
    } catch (err) {
        console.error('[getSubscription]', err);
        return fail(res, 'Failed to fetch subscription.', 500);
    }
};

// PUT /api/subscription  — upgrade / change plan
const updateSubscription = async (req, res) => {
    try {
        const { planName, autoRenew } = req.body;
        const validPlans = ['Free', 'Premium', 'Pro'];
        if (planName && !validPlans.includes(planName)) {
            return fail(res, `Invalid plan. Must be one of: ${validPlans.join(', ')}.`, 400);
        }

        const PLAN_FEATURES = Subscription.schema.statics.PLAN_FEATURES ||
            require('../models/subscriptionModel').PLAN_FEATURES;

        const updateData = {};
        if (planName) {
            updateData.planName = planName;
            updateData.features = PLAN_FEATURES
                ? PLAN_FEATURES[planName]
                : [];
            updateData.status = 'active';
            updateData.startDate = new Date();
            const end = new Date();
            end.setFullYear(end.getFullYear() + 1);
            updateData.endDate = end;
        }
        if (typeof autoRenew === 'boolean') updateData.autoRenew = autoRenew;

        const subscription = await Subscription.findOneAndUpdate(
            { userId: req.user.id },
            { $set: updateData },
            { new: true, upsert: true }
        );
        return ok(res, { subscription });
    } catch (err) {
        console.error('[updateSubscription]', err);
        return fail(res, 'Failed to update subscription.', 500);
    }
};

// DELETE /api/subscription  — cancel plan (downgrades to Free)
const cancelSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findOneAndUpdate(
            { userId: req.user.id },
            { $set: { status: 'cancelled', autoRenew: false } },
            { new: true }
        );
        if (!subscription) return fail(res, 'No subscription found.', 404);
        return ok(res, { subscription, message: 'Subscription cancelled.' });
    } catch (err) {
        console.error('[cancelSubscription]', err);
        return fail(res, 'Failed to cancel subscription.', 500);
    }
};

module.exports = { getSubscription, updateSubscription, cancelSubscription };
