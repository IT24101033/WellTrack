import express from "express"
import mongoose from "mongoose"


const app = express();

// const mongodbURL = "mongodb+srv://admin:admin@123@aiml.9i0tvu5.mongodb.net/?appName=aiml"
// mongoose.connect(mongodbURL).then(()=>{
//     console.log("DB connect")
// })



app.use(express.json());







const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})