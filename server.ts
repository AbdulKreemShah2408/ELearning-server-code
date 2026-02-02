import { app } from "./app";
import connectDB from "./utils/db"
import {v2 as cloudinary} from "cloudinary";
import http from "http";
import dotenv from "dotenv"

dotenv.config();

// create a server
const server=http.createServer(app);
cloudinary.config({
    cloud_name:process.env.CLOUDINARY_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
});

server.listen(process.env.PORT,()=>{
    console.log(`Server is connected with port ${process.env.PORT}`)
   connectDB()
})

