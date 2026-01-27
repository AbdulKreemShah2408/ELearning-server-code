import {Server as SocketIoServer} from "socket.io";
import http from "http";
export const initSocketServer=(server:http.Server)=>{
    const io=new SocketIoServer(server);
    io.on("connection",(socket)=>{
        console.log("User connected!");
        // listen for notification for event from server
        socket.on("notification",(data)=>{
            //Bradcast the notification data to all connected clients(admin dashboard)
            io.emit("newNotification",data);
        });
        socket.on("disconnect",()=>{
            console.log("User disconnected!")
        });
    });
};