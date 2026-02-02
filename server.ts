import { app } from "./app";
import connectDB from "./utils/db";
import { v2 as cloudinary } from "cloudinary";
import http from "http";
import dotenv from "dotenv";

dotenv.config();

const server = http.createServer(app);

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Database connection ko listen se pehle call karein
connectDB()
    .then(() => {
        console.log("Database connected successfully");
        // Sirf local development ke liye listen zaroori hai, 
        // Vercel app handler ko khud manage karta hai.
        if (process.env.NODE_ENV !== 'production') {
            server.listen(process.env.PORT || 8000, () => {
                console.log(`Server is connected with port ${process.env.PORT}`);
            });
        }
    })
    .catch((err) => {
        console.log("Database connection failed:", err);
    });

// Vercel ke liye export zaroori ho sakta hai agar aapne vercel.json sahi set nahi kiya
export default server;