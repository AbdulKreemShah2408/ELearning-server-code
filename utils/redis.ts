import { Redis } from "ioredis";
require('dotenv').config();

const redisClient = () => {
    if (process.env.REDIS_URL) {
        // Log tabhi karein jab connection actually successful ho
        return process.env.REDIS_URL;
    }
    throw new Error(`Redis connection URL missing`);
}

// TLS configuration add karein
export const redis = new Redis(redisClient(), {
    tls: {
        rejectUnauthorized: false
    }
});

redis.on('connect', () => {
    console.log("Redis connected successfully");
});

redis.on('error', (err) => {
    console.log("Redis connection error:", err);
});