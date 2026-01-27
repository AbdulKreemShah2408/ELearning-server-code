"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToken = exports.refreshTokenOptions = exports.accessTokenOptions = exports.refreshTokenExpiresIn = exports.accessTokenExpiresIn = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const redis_1 = require("./redis");
//parse enviorment variable to integrates with fall back
exports.accessTokenExpiresIn = parseInt(process.env.ACCESS_TOKEN_EXPIRE || "300", 10);
exports.refreshTokenExpiresIn = parseInt(process.env.REFRESH_TOKEN_EXPIRE || "1200", 10);
// options for cookie
exports.accessTokenOptions = {
    expires: new Date(Date.now() + exports.accessTokenExpiresIn * 60 * 60 * 1000),
    maxAge: exports.accessTokenExpiresIn * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
};
exports.refreshTokenOptions = {
    expires: new Date(Date.now() + exports.refreshTokenExpiresIn * 24 * 60 * 60 * 1000),
    maxAge: exports.refreshTokenExpiresIn * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
};
const sendToken = (user, statusCode, res) => {
    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();
    //upload session to cache redis
    redis_1.redis.set(user._id, JSON.stringify(user));
    //only set secure to true in production
    if (process.env.NODE_ENV === "production") {
        exports.accessTokenOptions.secure = true;
    }
    res.cookie("access_token", accessToken, exports.accessTokenOptions);
    res.cookie("refresh_token", refreshToken, exports.refreshTokenOptions);
    res.status(statusCode).json({
        success: true,
        user,
        accessToken,
    });
};
exports.sendToken = sendToken;
