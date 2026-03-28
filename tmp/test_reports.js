const mongoose = require('mongoose');
const Report = require('../backend/src/models/reportModel');

mongoose.connect('mongodb://localhost:27017/smart-health-risk-predictor', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log("Connected to MongoDB.");
    
    // 1. Get raw reports count
    const count = await Report.countDocuments();
    console.log("Total reports in DB:", count);
    
    // 2. See first report user_id
    const report = await Report.findOne();
    if (report) {
        console.log("First report user_id type:", typeof report.user_id, report.user_id);
    }
    
    // 3. Test aggregation
    const pipeline = [
        {
            $lookup: {
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'user',
            },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
            $facet: {
                metadata: [{ $count: 'total' }],
                data: [{ $skip: 0 }, { $limit: 10 }],
            },
        }
    ];
    
    const [result] = await Report.aggregate(pipeline);
    console.log("Aggregation result metadata:", result.metadata);
    console.log("Aggregation result data length:", result.data.length);
    if (result.data.length > 0) {
        console.log("First aggregated report user:", result.data[0].user);
    }

    mongoose.disconnect();
}).catch(console.error);
