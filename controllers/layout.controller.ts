import { NextFunction,Request,Response } from "express";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import layoutModel from "../models/layout.model";
import cloudinary from "cloudinary"
// create a layout

export const createLayout=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const {type}=req.body;
        const isTypeExits=await layoutModel.findOne({type});
        if(isTypeExits){
            return next(new ErrorHandler(`${type} already exits`,400));
        }
        if(type==="Banner"){
            const {image,title,subtitle}=req.body;
            const myCloud=await cloudinary.v2.uploader.upload(image,{folder:"Banner"});

            const Banner={
                type:"Banner",
                banner:{
                    image:{
                        public_id:myCloud.public_id,
                        url:myCloud.secure_url,
                    },
                    title,
                    subtitle,
                }
            };
            await layoutModel.create(Banner);
        }
        if(type==="FAQ"){
            const {faq}=req.body;
            const faqItems=faq.map((item:any)=>({
                question:item.question,
                answer:item.answer,
            }));
            await layoutModel.create({type:'FAQ',faq:faqItems});
        }
        if(type==="Categories"){
            const {categories}=req.body;
            const categoriesItems=await Promise.all(categories.map(async(item:any)=>{
                return {
                    title:item.title,
                }
            }));
            await layoutModel.create({type:'Categories',categories:categoriesItems})

        }
        res.status(201).json({
            success:true,
            message:"Layout created successfully"
        })
    } catch (error:any) {
        return next(new ErrorHandler(error.message,500));
    }
});

//Edit layouot 
export const editLayout=catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
try {
    const { type } = req.body;
    if (type == "Banner") {
    const bannerData:any=await layoutModel.findOne({type:'Banner'});
    if(!bannerData){
        return next(new ErrorHandler("Banner not found", 404));
    }
    const { image, title, subtitle } = req.body;
    const data=image.startsWith('https')? bannerData: await cloudinary.v2.uploader.upload(image, {
        folder: "Banner",
    });
    const banner = {
    type: "Banner",
    image: {
        public_id:image.startsWith('https')?bannerData.banner.image.public_id:data.public_id,
        url: image.startsWith('https') ?bannerData.banner.image.url:data.secure_url,
    },
    title,
    subtitle,
    };

    await layoutModel.findByIdAndUpdate(bannerData._id, {banner});
}
    if(type==='FAQ'){
    const {faq}=req.body;
    const faqData:any=await layoutModel.findOne({type:'FAQ'});
    if(!faqData){
        return next(new ErrorHandler("FAQ not found", 404));
    }
    // Validate faq structure
    const faqItems=await Promise.all(faq.map(async(item:any)=>{
    return {
                question: item.question,
                answer: item.answer
            }
        }))
        await layoutModel.findByIdAndUpdate(faqData._id,{type:'FAQ',faq:faqItems});
      }
      if(type==='Categories'){
        const {categories}=req.body;
        const categoriesData:any=await layoutModel.findOne({type:'Categories'});
        if(!categoriesData){
            return next(new ErrorHandler("Categories not found", 404));
        }
        const categoriesItems=await Promise.all(categories.map(async(item:any)=>{
            return {
            title:item.title
            }
        }))
    await layoutModel.findByIdAndUpdate(categoriesData._id, {
    type: 'Categories',
    categories: categoriesItems
  });
      }
      res.status(201).json({
        success: true,
        message: "Layout Updated successfully",
      }) 
} catch (error:any) {
      return next(new ErrorHandler(error.message, 500));
    }
})
// get layout

export const getLayoutByType=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const {type}=req.params;
        const layout=await layoutModel.findOne({type});
        res.status(201).json({
            success:true,
            layout,
        })
    } catch (error:any) {
        return next(new ErrorHandler(error.message,500));
    }
})