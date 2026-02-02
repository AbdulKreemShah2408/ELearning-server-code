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
// create a server
const server = http_1.default.createServer(app_1.app);
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
app_1.app.listen(process.env.PORT, () => {
    console.log(`Server is connected with port ${process.env.PORT}`);
    (0, db_1.default)();
});
