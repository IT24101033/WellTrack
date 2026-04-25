'use strict';

const Subscription = require('../models/subscriptionModel');
const Otp = require('../models/otpModel');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { sendAppAlert, sendEmail } = require('../utils/notificationService');

const ok = (res, data, status = 200) => res.status(status).json({ success: true, ...data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });

const stripeSecret = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const stripe = require('stripe')(stripeSecret);

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
        const { planName, autoRenew, paymentMethod } = req.body;
        const validPlans = ['Free', 'Plus', 'Pro'];
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
            
            // If payment is via bank receipt, status is pending. Otherwise immediately active (for Free or Stripe)
            const isManualPayment = paymentMethod === 'receipt' || req.file;
            updateData.status = isManualPayment && planName !== 'Free' ? 'pending' : 'active';
            
            updateData.startDate = new Date();
            const end = new Date();
            end.setFullYear(end.getFullYear() + 1);
            updateData.endDate = end;
        }
        if (typeof autoRenew === 'boolean') updateData.autoRenew = autoRenew;

        if (paymentMethod) {
            updateData.paymentMethod = paymentMethod;
        } else if (planName === 'Free') {
            updateData.paymentMethod = 'free';
        }

        if (req.file) {
            updateData.receiptUrl = `/uploads/${req.file.filename}`;
            if (!paymentMethod) updateData.paymentMethod = 'receipt';
        }

        const subscription = await Subscription.findOneAndUpdate(
            { userId: req.user.id },
            { $set: updateData },
            { new: true, upsert: true }
        );

        if (planName && updateData.status === 'active') {
            await sendAppAlert(
                req.user.id,
                'Subscription Updated',
                `Your WellTrack subscription has been updated to the ${planName} plan. Enjoy your features!`,
                'system'
            );
        } else if (planName && updateData.status === 'pending') {
             await sendAppAlert(
                req.user.id,
                'Payment Received',
                `We have received your payment slip for the ${planName} plan. An admin will verify it shortly.`,
                'system'
            );
        }

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

// POST /api/subscription/create-payment-intent
const createPaymentIntent = async (req, res) => {
    try {
        const { planName } = req.body;
        const validPlans = { 'Free': 0, 'Plus': 300, 'Pro': 500 };
        const amount = validPlans[planName];

        if (amount === undefined) {
            return fail(res, 'Invalid plan configuration.', 400);
        }

        if (amount === 0) {
            return ok(res, { clientSecret: null });
        }

        // Create a PaymentIntent with the specified amount.
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Stripe uses cents
            currency: 'lkr',
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return ok(res, { clientSecret: paymentIntent.client_secret });
    } catch (err) {
        console.error('[createPaymentIntent]', err);
        return fail(res, err.message || 'Failed to create payment intent.', 500);
    }
};

// ── Admin Functions ────────────────────────────────────────────────────────────

// GET /api/admin/subscriptions/pending
const getPendingSubscriptions = async (req, res) => {
    try {
        const subscriptions = await Subscription.find({ status: 'pending' })
            .populate('userId', 'fullName email')
            .sort({ updatedAt: -1 });
        return ok(res, { subscriptions });
    } catch (err) {
        console.error('[getPendingSubscriptions]', err);
        return fail(res, 'Failed to fetch pending subscriptions.', 500);
    }
};

// PATCH /api/admin/subscriptions/:id/verify
const verifySubscription = async (req, res) => {
    try {
        const { action } = req.body; // 'approve' or 'reject'
        if (!['approve', 'reject'].includes(action)) {
            return fail(res, 'Invalid action. Must be approve or reject.', 400);
        }

        const subscription = await Subscription.findById(req.params.id);
        if (!subscription) return fail(res, 'Subscription record not found.', 404);

        if (action === 'approve') {
            subscription.status = 'active';
            await sendAppAlert(
                subscription.userId,
                'Payment Verified!',
                `Your ${subscription.planName} subscription has been approved. Welcome to the ${subscription.planName} experience!`,
                'system'
            );
        } else {
            subscription.status = 'rejected';
            await sendAppAlert(
                subscription.userId,
                'Payment Rejected',
                `Your payment slip for the ${subscription.planName} plan was rejected. Please contact support or try uploading a clearer image.`,
                'system'
            );
        }

        await subscription.save();
        return ok(res, { subscription, message: `Subscription ${action === 'approve' ? 'approved' : 'rejected'} successfully.` });
    } catch (err) {
        console.error('[verifySubscription]', err);
        return fail(res, 'Failed to verify subscription.', 500);
    }
};

// ── Payment Verification (OTP) ────────────────────────────────────────────────

const sendPaymentOTP = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.email) return fail(res, 'User email not found.', 400);
        const userEmail = user.email;

        // Generate 6-digit code
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, 10);

        // Save to DB (overwrite existing for this email if any, or just create new)
        await Otp.deleteMany({ email: userEmail }); // Clear previous OTPs
        await Otp.create({ email: userEmail, otpHash });

        // Send Email
        const subject = 'Your WellTrack Payment Verification Code';
        const text = `Hello,\n\nYour verification code for the payment is: ${otp}\n\nThis code will expire in 10 minutes.\n\nThank you,\nWellTrack Team`;
        
        await sendEmail(userEmail, subject, text);

        return ok(res, { message: 'Verification code sent to your email.' });
    } catch (err) {
        console.error('[sendPaymentOTP]', err);
        return fail(res, 'Failed to send verification code.', 500);
    }
};

const verifyPaymentOTP = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return fail(res, 'Verification code is required.', 400);

        const user = await User.findById(req.user.id);
        if (!user || !user.email) return fail(res, 'User email not found.', 400);

        const otpRecord = await Otp.findOne({ email: user.email });
        if (!otpRecord) return fail(res, 'Verification code expired or not found. Please resend.', 400);

        const isMatch = await otpRecord.compareOtp(code);
        if (!isMatch) return fail(res, 'Invalid verification code.', 400);

        // Success - remove the OTP so it can't be used again
        await Otp.deleteOne({ _id: otpRecord._id });

        return ok(res, { message: 'Verification successful.' });
    } catch (err) {
        console.error('[verifyPaymentOTP]', err);
        return fail(res, 'Failed to verify code.', 500);
    }
};

module.exports = {
    getSubscription,
    updateSubscription,
    cancelSubscription,
    createPaymentIntent,
    getPendingSubscriptions,
    verifySubscription,
    sendPaymentOTP,
    verifyPaymentOTP
};
