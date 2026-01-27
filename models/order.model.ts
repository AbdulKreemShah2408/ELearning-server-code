import mongoose,{ Document,Model,Schema} from "mongoose";
export interface IOrder extends Document{
 courseId:string,
 userId:string,
 payment_Info:Object,
}

const orderSchema=new Schema<IOrder>({
 courseId:{
    type:String,
    required:true,
 },
 userId:{
    type:String,
    required:true,
 },
 payment_Info:{
    type:Object,
 }
},{timestamps:true});

const OrderModel:Model<IOrder>=mongoose.model("Order",orderSchema);


export default OrderModel;