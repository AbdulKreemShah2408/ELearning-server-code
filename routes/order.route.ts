import  express  from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { createOrder, getAllOrders, newPayment, sendStripePublishableKey } from "../controllers/order.controller";
import { updateAccessToken } from "../controllers/user.controller";
const orderRouter = express.Router();

orderRouter.post("/create-order",updateAccessToken,isAuthenticated,createOrder);
orderRouter.get("/get-all-orders",updateAccessToken,isAuthenticated,authorizeRoles("admin"),getAllOrders);
orderRouter.get("/payment/stripePublishAblekey",sendStripePublishableKey);
orderRouter.post("/payment/process",isAuthenticated,newPayment)


export default orderRouter;