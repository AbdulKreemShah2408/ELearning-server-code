"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocketServer = void 0;
const socket_io_1 = require("socket.io");
const initSocketServer = (server) => {
    const io = new socket_io_1.Server(server);
    io.on("connection", (socket) => {
        console.log("User connected!");
        // listen for notification for event from server
        socket.on("notification", (data) => {
            //Bradcast the notification data to all connected clients(admin dashboard)
            io.emit("newNotification", data);
        });
        socket.on("disconnect", () => {
            console.log("User disconnected!");
        });
    });
};
exports.initSocketServer = initSocketServer;
