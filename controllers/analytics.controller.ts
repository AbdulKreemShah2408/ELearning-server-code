import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import { generate12MonthsData } from "../utils/analytics.genrator";
import userModel from "../models/user.model";
import CourseModel from "../models/course.model";
import OrderModel from "../models/order.model";

// get analtics user --only admin

export const getUserAnalytics=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const users=await generate12MonthsData(userModel);

        res.status(200).json({
            success:true,
            users,
        })
    } catch (error:any) {
        return next(new ErrorHandler(error.message,500));
    }
});

// get course analytics --only admin
export const getCourseAnalytics=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const courses=await generate12MonthsData(CourseModel);
        res.status(200).json({
            success:true,
            courses,
        })
    } catch (error:any) {
        return next(new ErrorHandler(error.message,500));
    }
});

// get order analytics --only admin
export const getCOrderAnalytics=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const orders=await generate12MonthsData(OrderModel);
        res.status(200).json({
            success:true,
            orders,
        })
    } catch (error:any) {
        return next(new ErrorHandler(error.message,500));
    }
});
