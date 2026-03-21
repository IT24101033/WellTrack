const mongoose = require('mongoose');
const Subscription = require('./models/subscriptionModel');

setTimeout(() => {
    console.log("Subscription statics PLAN_FEATURES:", Subscription.PLAN_FEATURES);
    process.exit(0);
}, 200);
