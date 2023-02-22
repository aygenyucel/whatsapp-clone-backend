let onlineUsers = [];

export const socketHandler = (socket) => {
    const clientId = socket.id;
    console.log("Client connected: " + clientId);

    socket.on("disconnect", () => {
        console.log("Client disconnected: " + clientId);
    });

    //on error
    socket.on("error", (err) => {
        console.log("received error from client:", clientId);
        console.log(err);
    });
};
