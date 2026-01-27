"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCOrderAnalytics = exports.getCourseAnalytics = exports.getUserAnalytics = void 0;
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const analytics_genrator_1 = require("../utils/analytics.genrator");
const user_model_1 = __importDefault(require("../models/user.model"));
const course_model_1 = __importDefault(require("../models/course.model"));
const order_model_1 = __importDefault(require("../models/order.model"));
// get analtics user --only admin
exports.getUserAnalytics = (0, catchAsyncErrors_1.catchAsyncError)(async (req, res, next) => {
    try {
        const users = await (0, analytics_genrator_1.generate12MonthsData)(user_model_1.default);
        res.status(200).json({
            success: true,
            users,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get course analytics --only admin
exports.getCourseAnalytics = (0, catchAsyncErrors_1.catchAsyncError)(async (req, res, next) => {
    try {
        const courses = await (0, analytics_genrator_1.generate12MonthsData)(course_model_1.default);
        res.status(200).json({
            success: true,
            courses,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get order analytics --only admin
exports.getCOrderAnalytics = (0, catchAsyncErrors_1.catchAsyncError)(async (req, res, next) => {
    try {
        const orders = await (0, analytics_genrator_1.generate12MonthsData)(order_model_1.default);
        res.status(200).json({
            success: true,
            orders,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
