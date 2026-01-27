require('dotenv').config();
import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
const emailRegexPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
import jwt from "jsonwebtoken"
export interface IUser extends Document {
  _id:string
  name: string;
  email: string;
  password: string;
  avatar: {
    public_id: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  courses: Array<{ courseId: string }>;
  comparePassword: (password: string) => Promise<boolean>;
  SignAccessToken:()=>string;
  SignRefreshToken:()=>string;
}

const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Plase enter your email"],
      unique: true,
      validate: {
        validator: function (value: string) {
          return emailRegexPattern.test(value);
        },
        message: "Please enter your valid email",
      },
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least character"],
      select: false,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      default:"user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    courses: [
      {
        courseId: String,
      },
    ],
  },
  { timestamps: true }
);

// hash password befor saving
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
// sign access token
userSchema.methods.SignAccessToken=function():string{
  return jwt.sign({id:this._id},process.env.ACCESS_TOKEN || '',{expiresIn:"5m"})
}
// sign refresh token
userSchema.methods.SignRefreshToken=function():string{
  return jwt.sign({id:this._id},process.env.REFRESH_TOKEN || '',{expiresIn:"7d"})
}

// compare password
userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const userModel: Model<IUser> = mongoose.model("User", userSchema);
export default userModel;
