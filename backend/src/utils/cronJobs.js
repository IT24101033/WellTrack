'use strict';

const cron = require('node-cron');
const { importDietTips, importWorkoutTips, importMentalTips } = require('../controllers/tipController');

const initCronJobs = () => {
    // Schedule task to run at 2:00 AM every day
    // This allows fetching random data and inserting them into the database automatically
    cron.schedule('0 2 * * *', async () => {
        console.log('[CRON] Starting Daily External Tips Import...');

        // Mock a req/res object since the controllers use Express handlers
        const mockReq = {};
        const mockRes = {
            status: function () { return this; },
            json: function (data) { console.log('[CRON_RES]:', data); return this; }
        };
        const mockNext = (err) => { console.error('[CRON_NEXT_ERR]:', err); };

        try {
            await importDietTips(mockReq, mockRes, mockNext);
            await importWorkoutTips(mockReq, mockRes, mockNext);
            await importMentalTips(mockReq, mockRes, mockNext);
            console.log('[CRON] Finished Daily External Tips Import.');
        } catch (error) {
            console.error('[CRON] Error executing daily tips import:', error.message);
        }
    });

    console.log('Cron jobs initialized.');
};

module.exports = { initCronJobs };
