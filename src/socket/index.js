import { Socket } from "socket.io";

let onlineUsers = [];

export default (socket) => {
    const clientId = socket.id;
    console.log("Client connected: " + clientId);

    socket.on("disconnect", () => {
        console.log("Client disconnected: " + clientId);
    });
};
