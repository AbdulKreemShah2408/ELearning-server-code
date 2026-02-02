import {NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudianry from "cloudinary";
import { createCourse, getAllCourseService } from "../services/course.service";
import CourseModel from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";
import axios from "axios";

//upload course
export const uploadCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      if (thumbnail) {
        const myCloud = await cloudianry.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      createCourse(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
//edit course
export const editCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      const courseId = req.params.id;
      const courseData=await CourseModel.findById(courseId) as any;

      if (thumbnail && !thumbnail.startsWith("https")) {
        await cloudianry.v2.uploader.destroy(courseData.thumbnail.public_id);
        const myCloud = await cloudianry.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      if(thumbnail.startsWith("https")){
        data.thumbnail={
          public_id:courseData?.thumbnail.public_id,
          url:courseData?.thumbnail.url,

        }
      }
      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        { $set: data },
        { new: true }
      );
       if (redis) {
        await redis.del(`course:${courseId}`);
        await redis.del("allcourses");
      }
      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get single course ----without parchase

export const getSingleCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const isCachExits = await redis.get(courseId);
      if (isCachExits) {
        const course = JSON.parse(isCachExits);
        res.status(200).json({
          success: true,
          course,
        });
      } else {
        const course = await CourseModel.findById(req.params.id).select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );
        await redis.set(courseId, JSON.stringify(course), "EX", 604800);
        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get all courses --without parchase
export const getAllCourses = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // const isCachExits = await redis.get("allcourses");
      // if (isCachExits) {
      //   const course = JSON.parse(isCachExits);

      //   res.status(200).json({
      //     success: true,
      //     course,
      //   });
      // } else {
        const courses = await CourseModel.find().select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );
        await redis.set("allcourses", JSON.stringify(courses));

        res.status(200).json({
          success: true,
          courses,
        });
      }
     catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get course content  --only for valid user
export const getCourseByUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;
      const courseExits = userCourseList?.find(
        (course: any) => course._id.toString() === courseId.toString()
      );
      if (!courseExits) {
        return next(
          new ErrorHandler("You are not eligible to access this course.", 400)
        );
      }
      const course = await CourseModel.findById(courseId);
      const content = course?.courseData;
      res.status(200).json({
        success: true,
        content,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add question in the course
interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}

export const AddQuestionData = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId }: IAddQuestionData = req.body;
      const course = await CourseModel.findById(courseId);
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id,", 400));
      }
      const courseContent = course?.courseData.find((content: any) =>
        content._id.equals(contentId)
      );
      if (!courseContent) {
        return next(new ErrorHandler("Content not found!.", 404));
      }
      // create a new question object
      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: [],
      };
      // add question to our course content
      courseContent.questions.push(newQuestion);
        await NotificationModel.create({
        user:req.user?._id,
        title:"New Question Recived",
        message:`You have a new question in  ${courseContent?.title}`
    })
      // save the updated course
      await course?.save();
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// add answer to the question
interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}
export const addAnswer = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId }: IAddAnswerData =
        req.body;
      const course = await CourseModel.findById(courseId);
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return next(new ErrorHandler("Invalid content id", 400));
      }
      const courseContent = course?.courseData.find((content: any) =>
        content._id.equals(contentId)
      );
      if (!courseContent) {
        return next(new ErrorHandler("Content not found!", 404));
      }
      const question = courseContent.questions.find((q: any) =>
        q._id.equals(questionId)
      );
      if (!question) {
        return next(new ErrorHandler("Invalid question id", 401));
      }
      // create an answer object
      const newAnswer: any = {
        user: req.user,
        answer,
        createdAt:new Date().toISOString(),
        updatedAt:new Date().toISOString(),
      };
      question.questionReplies?.push(newAnswer);
      await course?.save();
      if (req.user?._id === question.user._id) {
        // create n notification
        await NotificationModel.create({
            user:req.user?._id,
            title:"New Question Recived",
            message:`You have a new question from ${courseContent?.title}`
        })
      } else {
        const data = {
          name: question.user.name,
          title: courseContent.title,
        };

        try {
          // Sirf sendMail call karein, rendering andar khud ho jayegi
          await sendMail({
            email: question.user.email,
            subject: "Question Reply",
            template: "questionReply.ejs", 
            data,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 500));
        }
      }
      res.status(200).json({
        success: true,
        course: course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add review in the course
interface IAddReviewData {
  courseId: string;
  review: string;
  rating: number;
  userId: string;
}

export const addReview = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;
      // check if the course id exits in the user course list bases on _id
      const courseExits = userCourseList?.find(
        (course: any) => course?._id.toString() === courseId
      );
      if (!courseExits) {
        return next(
          new ErrorHandler("You are not eligible for this course", 403)
        );
      }
      const course = await CourseModel.findById(courseId);
      const { review, rating } = req.body as IAddReviewData;
      const reviewData: any = {
        user: req.user,
        comment: review,
        rating,
      };
      course?.reviews.push(reviewData);
      let avg = 0;
      course?.reviews.forEach((rev: any) => (avg += rev.rating));
      if (course) {
        course.ratings = avg / course.reviews.length;
      }

      await course?.save();
       await redis.set(courseId,JSON.stringify(course),'EX',604800);
      // create notification
      await NotificationModel.create({
            user:req.user?._id,
            title:"New Review",
            message:`You have a new review from ${course?.name}`
        })
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add reply in review
interface IAdddReviewReplyData{
  comment:string,
  courseId:string,
  reviewId:string,
}
export const addReply=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const {comment,courseId,reviewId}=req.body as IAdddReviewReplyData;
    const course=await CourseModel.findById(courseId);
    if(!courseId){
      return next(new ErrorHandler("Course not found!",404));
    }
    const review=course?.reviews.find((rev:any)=>rev._id.toString()===reviewId);
    if(!review){
      return next(new ErrorHandler("Reviews not found",400));
    }
    const replyData:any={
      user:req.user,
      comment,
       createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString(),
    }
    if(!review.commentReplies){
      review.commentReplies=[];
    }
    review.commentReplies.push(replyData);
    await course?.save();
    await redis.set(courseId,JSON.stringify(course),'EX',604800);
    res.status(200).json({
      success:true,
      course,
    })
  } catch (error:any) {
    return next(new ErrorHandler(error.message,500));
  }
});
// get all  course --admin
export const getAllCourseAdmin=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    getAllCourseService(res);
  } catch (error:any) {
    return next(new ErrorHandler(error.message,500));
  }
});
//delete course --only for admin
export const deleteCourse=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const {id}=req.params;
    const course=await CourseModel.findById(id);
    if(!course){
      return next(new ErrorHandler("User not found",404));
    }
    await course.deleteOne({id});
    await redis.del(id);
    res.status(200).json({
      success:true,
      message:"Course deleted successfully",
      course,
    })
  } catch (error:any) {
    return next(new ErrorHandler(error.message,500));
  }
})
// generate video url
export const generateVideoUrl = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { videoId } = req.body;
   
     
      const response = await axios.post(
        `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
        {
          ttl: 300,
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
          },
        }
      );
      res.json(response.data);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);