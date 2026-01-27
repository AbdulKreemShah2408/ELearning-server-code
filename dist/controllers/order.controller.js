"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newPayment = exports.sendStripePublishableKey = exports.getAllOrders = exports.createOrder = void 0;
require('dotenv').config();
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const user_model_1 = __importDefault(require("../models/user.model"));
const course_model_1 = __importDefault(require("../models/course.model"));
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const order_service_1 = require("../services/order.service");
const redis_1 = require("../utils/redis");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
//create order
exports.createOrder = (0, catchAsyncErrors_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { courseId, payment_Info } = req.body;
        // verifiy the stripe payment intent 
        if (payment_Info) {
            if ('id' in payment_Info) {
                const paymentIntentId = payment_Info.id;
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
                if (paymentIntent.status != 'succeeded') {
                    return next(new ErrorHandler_1.default("Payment not successfull!", 400));
                }
            }
        }
        const user = await user_model_1.default.findById(req.user?._id);
        // check if course alradey purchase
        const courseExitsInUser = user?.courses.some((course) => course._id.toString() === courseId);
        if (courseExitsInUser) {
            return next(new ErrorHandler_1.default("You have already purchases this course", 400));
        }
        // check if the course exits
        const course = await course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found! ", 404));
        }
        const data = {
            courseId: course._id,
            userId: user?._id,
            payment_Info,
        };
        // prepare mail data
        const mailData = {
            order: {
                _id: course._id.toString().slice(0, 6),
                name: course.name,
                price: course.price,
                date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
            }
        };
        //send email
        const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/order-confirmation.ejs"), { order: mailData });
        try {
            if (user) {
                await (0, sendMail_1.default)({
                    email: user.email,
                    subject: "Order Confirmation",
                    template: "order-confirmation.ejs",
                    data: mailData,
                });
            }
        }
        catch (error) {
            return next(new ErrorHandler_1.default(error.message, 400));
        }
        //update User course
        user?.courses.push(course?._id);
        await redis_1.redis.set(req.user._id, JSON.stringify(user));
        await user?.save();
        course.purchased = (course.purchased || 0) + 1;
        await course.save();
        // notification for admin
        await notification_model_1.default.create({
            user: req.user?._id,
            title: "New Order",
            message: `You have a new Order from ${course.name}`
        });
        (0, order_service_1.newOrder)(data, res, next);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get all  orders --admin
exports.getAllOrders = (0, catchAsyncErrors_1.catchAsyncError)(async (req, res, next) => {
    try {
        (0, order_service_1.getAllOrdersService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// send stipe publishable key
exports.sendStripePublishableKey = (0, catchAsyncErrors_1.catchAsyncError)((req, res, next) => {
    res.status(200).json({
        success: true,
        publishablekey: process.env.STRIPE_PUBLISHABLE_KEY
    });
});
// new payment
exports.newPayment = (0, catchAsyncErrors_1.catchAsyncError)(async (req, res, next) => {
    try {
        const myPayment = await stripe.paymentIntents.create({
            amount: req.body.amount,
            currency: 'USD',
            metadata: {
                company: "ELearning"
            },
            automatic_payment_methods: {
                enabled: true,
            }
        });
        res.status(201).json({
            client_secret: myPayment.client_secret,
            success: true,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
