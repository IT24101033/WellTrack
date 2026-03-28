const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/welltrack', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log("Connected to MongoDB.");
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    for (const c of collections) {
        const count = await db.collection(c.name).countDocuments();
        console.log(`Collection: ${c.name} - count: ${count}`);
    }
    mongoose.disconnect();
}).catch(console.error);
