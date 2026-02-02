"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = require("ioredis");
require('dotenv').config();
const redisClient = () => {
    if (process.env.REDIS_URL) {
        // Log tabhi karein jab connection actually successful ho
        return process.env.REDIS_URL;
    }
    throw new Error(`Redis connection URL missing`);
};
// TLS configuration add karein
exports.redis = new ioredis_1.Redis(redisClient(), {
    tls: {
        rejectUnauthorized: false
    }
});
exports.redis.on('connect', () => {
    console.log("Redis connected successfully");
});
exports.redis.on('error', (err) => {
    console.log("Redis connection error:", err);
});
