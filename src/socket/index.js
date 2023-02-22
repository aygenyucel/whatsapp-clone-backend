let onlineUsers = [];

//todo use handshake to verify access token / refresh token

export const socketHandler = (socket) => {
    const clientId = socket.id;
    console.log("Client connected: " + clientId);

    socket.emit("welcome", "Welcome to WhatsApp");

    socket.on("disconnect", () => {
        console.log("Client disconnected: " + clientId);
    });

    //on error
    socket.on("error", (err) => {
        console.log("received error from client:", clientId);
        console.log(err);
    });

    //chat handler
    socket.on("sendMessage", (data) => {
        console.log(
            `received message from ${clientId}: ${data.message.content.text}`
        );
        socket.broadcast.emit("newMessage", data.message);
    });
};
