'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { connect } = require('./config/db');
const app = require('./app');
const { startReminderScheduler } = require('./utils/reminderScheduler');
const port = parseInt(process.env.PORT || '5000', 10);

(async () => {
    // Connect to MongoDB before accepting HTTP traffic
    await connect();

    // Start background reminder scheduler
    startReminderScheduler();

    // Seed default health plans
    const { seedPlans } = require('./utils/seedUtils');
    await seedPlans();

    const server = app.listen(port, () => {
        console.log(`🚀  Server running on http://localhost:${port}  [${process.env.NODE_ENV || 'development'}]`);
    });

    // ── Graceful Shutdown ─────────────────────────────────────────────────────
    const shutdown = (signal) => {
        console.log(`\n⚠️   ${signal} received — shutting down gracefully…`);
        server.close(() => {
            console.log('✅  HTTP server closed.');
            process.exit(0);
        });
        setTimeout(() => {
            console.error('❌  Forced shutdown after timeout.');
            process.exit(1);
        }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
})();

// ── Unhandled rejections / exceptions ────────────────────────────────────────
process.on('unhandledRejection', (reason) =>
    console.error('❌  Unhandled Rejection:', reason)
);
process.on('uncaughtException', (err) => {
    console.error('❌  Uncaught Exception:', err);
    process.exit(1);
});
