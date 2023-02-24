let onlineUsers = [];
import {
    verifyAccessToken,
    verifyRefreshAndCreateNewTokens,
} from "../api/lib/jwt-tools.js";
import Message from "../api/messages/model.js";

//todo use handshake to verify access token / refresh token

const saveMessage = (text, user) =>
    new Promise((resolve, reject) => {
        const message = new Message({
            sender: user._id,
            content: {
                text,
            },
        });
        const returnData = {
            sender: {
                _id: user._id,
                name: user.name,
                avatar: user.avatar,
            },
            messageId: message._id,
            content: {
                text,
            },
            timestamp: new Date().getTime(),
        };
        message.save((err, message) => {
            if (err) reject(err);
            else resolve(returnData);
        });
    });

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
        const { accessToken, refreshToken } = data;
        console.log(
            `received message from ${clientId}: ${data.message.content.text}`
        );

        if (!accessToken || !refreshToken) {
            socket.emit("error", "You are not authorized to send messages");
            return;
        }

        //verify access token
        verifyAccessToken(accessToken)
            .then((user) => {
                //Access token is valid

                saveMessage(data.message.content.text, user).then(
                    (returnMessage) => {
                        socket.broadcast.emit("newMessage", {
                            message: returnMessage,
                        });
                    }
                );
            })
            .catch((err) => {
                //verify refresh token
                verifyRefreshAndCreateNewTokens(refreshToken)
                    .then(
                        ({
                            accessToken: newAccessToken,
                            refreshToken: newRefreshToken,
                            user,
                        }) => {
                            //refresh token is valid
                            console.log("Refresh token is valid");
                            //todo send new tokens to client
                            socket.emit("newTokens", {
                                accessToken: newAccessToken,
                                refreshToken: newRefreshToken,
                            });

                            saveMessage(data.message.content.text, user).then(
                                (returnMessage) => {
                                    socket.broadcast.emit("newMessage", {
                                        message: returnMessage,
                                    });
                                }
                            );
                        }
                    )
                    .catch((err) => {
                        socket.emit(
                            "error",
                            "You are not authorized to send messages"
                        );
                    });
            });

        socket.broadcast.emit("newMessage", data.message);
    });
};
