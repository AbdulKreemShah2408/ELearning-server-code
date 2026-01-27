import dotenv from "dotenv";
dotenv.config();
import { Response } from "express";
import { IUser } from "../models/user.model";
import {redis} from "./redis"
interface ITokenOptions {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure?: boolean;
}

//parse enviorment variable to integrates with fall back
export const accessTokenExpiresIn = parseInt(
  process.env.ACCESS_TOKEN_EXPIRE || "300",
  10
);
export const refreshTokenExpiresIn = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE || "1200",
  10
);

// options for cookie
export const accessTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + accessTokenExpiresIn * 60 * 60 * 1000),
  maxAge: accessTokenExpiresIn * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};
export const refreshTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpiresIn * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpiresIn * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.SignAccessToken();
  const refreshToken = user.SignRefreshToken();
  //upload session to cache redis
   redis.set(user._id, JSON.stringify(user) as any);
  //only set secure to true in production
  if (process.env.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
  }

  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);
  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};
