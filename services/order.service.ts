import { NextFunction,Request,Response } from "express";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import OrderModel,{IOrder} from "../models/order.model";

// create new order
export const newOrder=catchAsyncError(async(data:any,res:Response,next:NextFunction)=>{
    const order=await OrderModel.create(data);
    res.status(200).json({
        success:true,
        order,
    })
});

//Get all orders
export const getAllOrdersService=async(res:Response)=>{
    const orders=await OrderModel.find().sort({createdAt:-1});
    res.status(201).json({
        success:true,
        orders,
    })
}