require ('dotenv').config()
import express, { NextFunction, Request, Response } from "express"
export const app=express();
import cors from "cors"
import cookieParser from "cookie-parser";
import {errorMiddleware} from "./middleware/error"
import userRouter from "./routes/user.route"
import courseRouter from "./routes/course.route";
import orderRouter from "./routes/order.route";
import notificationRouter from "./routes/notification.route";
import analyticsRouter from "./routes/analytics.route";
import layoutRouter from "./routes/layout.route";
import { rateLimit } from 'express-rate-limit'

// 1. Body parser
app.use(express.json({limit:"50mb"}));

// 2. Cookie parser
app.use(cookieParser());

// 3. CORS (Credentials true hona lazmi hai cookies ke liye)
app.use(cors({
    origin: 'https://e-learning-client-code.vercel.app',
    credentials: true,
}));

// 4. Rate Limiter (Routes se PEHLE hona chahiye)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
app.use(limiter); // <--- Yahan shift kar diya

// 5. Routes
app.use("/api/v1", userRouter);
app.use("/api/v1", courseRouter);
app.use("/api/v1", orderRouter);
app.use("/api/v1", notificationRouter);
app.use("/api/v1", analyticsRouter);
app.use("/api/v1", layoutRouter);

// Testing route
app.get("/test", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Api is working",
  });
});

// Unknown route handler
app.all("*", (req: Request, res: Response, next: NextFunction) => {
    const err = new Error(`Route ${req.originalUrl} not found`) as any;
    err.statusCode = 404; // Route not found hamesha 404 hona chahiye
    next(err);
});

// 6. Global Error Middleware (Hamesha AAKHIR mein)
app.use(errorMiddleware);