import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config();



const app = express();

const mongodbURL = process.env.MONGO_URL
mongoose.connect(mongodbURL).then(()=>{
    console.log("DB connect")
})



app.use(express.json());









app.listen(3000, () => {
    console.log("Server is running");
})