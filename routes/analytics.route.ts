import express from "express"
import { isAuthenticated,authorizeRoles } from "../middleware/auth"
import { getCOrderAnalytics, getCourseAnalytics, getUserAnalytics } from "../controllers/analytics.controller";
import { updateAccessToken } from "../controllers/user.controller";
const analyticsRouter=express.Router();

analyticsRouter.get("/get-user-analytics",updateAccessToken,isAuthenticated,authorizeRoles("admin"),getUserAnalytics);
analyticsRouter.get("/get-course-analytics",updateAccessToken,isAuthenticated,authorizeRoles("admin"),getCourseAnalytics);
analyticsRouter.get("/get-order-analytics",updateAccessToken,isAuthenticated,authorizeRoles("admin"),getCOrderAnalytics);

export default analyticsRouter;
