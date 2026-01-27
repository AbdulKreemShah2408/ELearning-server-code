import express from "express";
import {
  activateUser,
  deleteUser,
  getAllUsers,
  getUserInfo,
  LoginUser,
  LogoutUser,
  registerationUser,
  socialAuth,
  updateAccessToken,
  updateUserInfo,
  updateUserPassword,
  updateUserProfilePicture,
  updateUserRole,
} from "../controllers/user.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
const userRouter = express.Router();

userRouter.post("/registration", registerationUser);
userRouter.post("/activate-user", activateUser);
userRouter.post("/login", LoginUser);
userRouter.get("/logout",updateAccessToken, isAuthenticated, LogoutUser);
userRouter.get("/refresh_token", updateAccessToken);
userRouter.get("/me",updateAccessToken, isAuthenticated, getUserInfo);
userRouter.post("/social-auth", socialAuth);
userRouter.put("/update-user-info",updateAccessToken,isAuthenticated, updateUserInfo);
userRouter.put("/update-user-password",updateAccessToken,isAuthenticated, updateUserPassword);
userRouter.put("/update-user-avatar",updateAccessToken,isAuthenticated, updateUserProfilePicture);
userRouter.get("/get-all-users",updateAccessToken,isAuthenticated,authorizeRoles("admin"),getAllUsers);
userRouter.put("/update-user-role",updateAccessToken,isAuthenticated,authorizeRoles("admin"),updateUserRole);
userRouter.delete("/delete-user/:id",updateAccessToken,isAuthenticated,authorizeRoles("admin"),deleteUser);

export default userRouter;
