'use strict';

/**
 * config/db.js
 * Mongoose connection to MongoDB.
 * Exports a connect() function called once at server startup.
 */

const mongoose = require('mongoose');

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log(`✅  MongoDB connected  →  ${process.env.MONGO_URI}`);
    } catch (err) {
        console.error('❌  MongoDB connection failed:', err.message);
        process.exit(1);
    }
};

// Log connection events for observability
mongoose.connection.on('disconnected', () =>
    console.warn('⚠️   MongoDB disconnected.')
);
mongoose.connection.on('reconnected', () =>
    console.log('✅  MongoDB reconnected.')
);

module.exports = { connect };
