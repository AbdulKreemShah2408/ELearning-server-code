require("dotenv").config();
import { NextFunction,Request, Response} from "express";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import {accessTokenOptions, refreshTokenOptions, sendToken} from "../utils/jwt"
import sendMail from "../utils/sendMail";
import ejs from "ejs";
import path from "path";
import cloudinary from "cloudinary"
import { redis } from "../utils/redis";
import { getAllUserService, getUserById, updateUserRoleService } from "../services/user.service";
// register user
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const registerationUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, avatar } = req.body;
      const isEmailExist = await userModel.findOne({ email });
      if (isEmailExist) {
        return next(new ErrorHandler("Email Already exits!", 400));
      }
      const user: IRegistrationBody = {
        name,
        email,
        password,
      };
      const activationToken = createActivationToken(user);
      const activationCode = activationToken.activationCode;
      const data = { user: { name: user.name }, activationCode };
      const templatePath = path.join(process.cwd(), "mails", "questionReply.ejs");
    try {
          // ejs.renderFile ko await ke sath use karein
          const html = await ejs.renderFile(templatePath, data);

          await sendMail({
            email: user.email,
            subject: "Question Reply",
            template: "questionReply.ejs", // ensure sendMail function uses the 'html' generated above or handles the template correctly
            data,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 500));
        }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );

  return { token, activationCode };
};

//activation user
interface IActivationRequest{
activation_token:string,
activation_code:string,
}

export const activateUser=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const {activation_token,activation_code}=req.body as IActivationRequest;
    const newUser:{user:IUser,activationCode:string}=jwt.verify(
      activation_token,
      process.env.ACTIVATION_SECRET as Secret
    ) as any;
    if(newUser.activationCode !==activation_code){
      return next (new ErrorHandler('Invalid activation code',400))
    }
    const {name,email,password}=newUser.user;
    const existUser=await userModel.findOne({email});
    if(existUser){
      return next (new ErrorHandler("Email already exist!",400));
    }

    const user=await userModel.create({
      name,
      email,
      password,
    });
    res.status(201).json({
      success:true,
      message:"User activated successfully",
    });
  } catch (error:any) {
    return next (new ErrorHandler(error.message,400))
  }
});

// login user
interface ILoginRequest {
  email:string,
  password:string,
}

export const LoginUser=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const {email,password}=req.body as ILoginRequest;
    if(!email || !password){
      return next(new ErrorHandler('Plaese enter your emil or password',400));
    }
    const user=await userModel.findOne({email}).select("+password");
    if(!user){
      return next(new ErrorHandler('Invalid emil or password',401));
    }
    const isPasswordMatch=await user.comparePassword(password);
    if(!isPasswordMatch){
      return next (new ErrorHandler('Invalid email or password',401));
    }
    sendToken(user,200,res)

  } catch (error:any) {
    return next(new ErrorHandler(error.message,400));
  }
});
// logout user
export const LogoutUser=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    res.cookie("access_token","",{maxAge:1});
    res.cookie("refresh_token","",{maxAge:1});
   const userId = req.user?._id || "";
      redis.del(userId);
    res.status(200).json({
      success:true,
      message:"User logged out successfully"
    })
  } catch (error:any) {
    return next (new ErrorHandler(error.message,400));
  }
});


// update the access token
export const updateAccessToken=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const refresh_token=req.cookies.refresh_token as string;
    const decode=jwt.verify(refresh_token,process.env.REFRESH_TOKEN as string) as JwtPayload;
    if(!decode){
      return next(new ErrorHandler("Could not Refresh token",400));
    }
    const session=await redis.get(decode.id as string);
    if(!session){
      return next(new ErrorHandler("Session expired,plase login again!",401));
    }
    const user=JSON.parse(session);
    const accessToken=jwt.sign({id:user._id},process.env.ACCESS_TOKEN as string);
    const refreshToken=jwt.sign({id:user._id},process.env.REFRESH_TOKEN as string);
    req.user=user;
    res.cookie("access_token",accessToken,accessTokenOptions);
    res.cookie("refresh_token",refreshToken,refreshTokenOptions);
    await redis.set(user._id, JSON.stringify(user),'EX',604800);
    next();


  } catch (error:any) {
    return next(new ErrorHandler(error.message,400))
  }
});

// get user info
export const getUserInfo=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const userId=req.user?._id || "";
    getUserById(userId,res);
  } catch (error:any) {
    return next(new ErrorHandler(error.message,400));
  }
});

// social Auth
interface  ISocialAuthBody{
  email:string,
  name:string,
  avatar:string,
}

export const socialAuth=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const {email,name,avatar}=req.body as ISocialAuthBody;
    const user=await userModel.findOne({email});
    if(!user){
     const newUser=await userModel.create({email,name,avatar});
     sendToken(newUser,200,res);
    }
    else{
      sendToken(user,200,res);
    }
  } catch (error:any) {
    return next(new ErrorHandler(error.message,400));
  }
});

//updte user info
interface IUserUpdateInfo{
  name:string,
  email:string,
}

export const updateUserInfo=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const {name}=req.body as IUserUpdateInfo;
      const userId=req.user?._id;
      if(!userId){
        return next(new Error("User ID is undefined"));
      }
      const user=await userModel.findById(userId);
     
      if(name && user){
        user.name=name;
      }
      await user?.save();
      await redis.set(userId,JSON.stringify(user));
      res.status(201).json({
        success:true,
        user,
      })
  } catch (error:any) {
    return next(new ErrorHandler(error.message,400))
  }
});


// update user password
interface IUpdatePassword{
  oldPassword:string,
  newPassword:string,
}

export const updateUserPassword=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const {oldPassword,newPassword}=req.body as IUpdatePassword;
    if(!oldPassword || !newPassword){
      return next(new ErrorHandler("Please enter your old and new password",400));
    }
    const user=await userModel.findById(req.user?._id).select("+password");
    if(user?.password===undefined){
      return next(new ErrorHandler("User not found",404));
    }
    const isPasswordMatch=await user?.comparePassword(oldPassword);
    if(!isPasswordMatch){
      return next(new ErrorHandler("Old password is incorrect",401))
    }
    user.password=newPassword;
    await user.save();
    const userId=req.user?._id || "";
    if(!userId){
      return next(new Error("User ID is undefined"));
    }
    await redis?.set(userId,JSON.stringify(user));
    res.status(200).json({
      success:true,
      message:"Password updated successfull",
      user,
    })
  } catch (error:any) {
    return next(new ErrorHandler(error.message,400))
  }
});

// update user profile avatar
interface IUpdateProfilePicture{
  avatar:string
}

export const updateUserProfilePicture=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const {avatar}=req.body;
    const userId=req.user?._id;
    const user=await userModel.findById(userId);
    if(avatar && user){
      //if we have one avatar then call this
      if(user?.avatar?.public_id){
        // first delete the old img
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);
        await cloudinary.v2.uploader.destroy(user?.avatar.public_id);
        const myCloud=await cloudinary.v2.uploader.upload(avatar,{folder:"avatars",width:150});
        user.avatar={
          public_id:myCloud.public_id,
          url:myCloud.secure_url,
        }

      }else{
        if(avatar){
          const myCloud=await cloudinary.v2.uploader.upload(avatar,{folder:"avatars",width:150});
           user.avatar={
          public_id:myCloud.public_id,
          url:myCloud.secure_url,
        }
        }
      }
    }
    await user?.save();
    if(!userId){
      return next(new Error("UserId is undefined"));

    }
    await redis.set(userId,JSON.stringify(user));
    res.status(200).json({
      success:true,
      user,
    })
  } catch (error:any) {
    return next(new ErrorHandler(error.message,400));
  }
});
// get all users --admin
export const getAllUsers=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    getAllUserService(res);
  } catch (error:any) {
    return next(new ErrorHandler(error.message,500));
  }
});

// update user role --admin
export const updateUserRole=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const {id,role}=req.body;
    updateUserRoleService(res,id,role);
  } catch (error:any) {
    return next(new ErrorHandler(error.message,500));
  }
});

//delete user --only for admin
export const deleteUser=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const {id}=req.params;
    const user=await userModel.findById(id);
    if(!user){
      return next(new ErrorHandler("User not found",404));
    }
    await user.deleteOne({id});
    await redis.del(id);
    res.status(200).json({
      success:true,
      message:"User deleted successfully",
      user,
    })
  } catch (error:any) {
    return next(new ErrorHandler(error.message,500));
  }
})