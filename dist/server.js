"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const db_1 = __importDefault(require("./utils/db"));
const cloudinary_1 = require("cloudinary");
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const server = http_1.default.createServer(app_1.app);
// Cloudinary config
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Database connection ko listen se pehle call karein
(0, db_1.default)()
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
exports.default = server;
