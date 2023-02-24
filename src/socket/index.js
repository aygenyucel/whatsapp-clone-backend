let onlineUsers = [];
import {
    verifyAccessToken,
    verifyRefreshAndCreateNewTokens,
} from "../api/lib/jwt-tools.js";
import Message from "../api/messages/model.js";
import User from "../api/Users/model.js";

//todo use handshake to verify access token / refresh token

const saveMessage = (text, user, receiver) =>
    new Promise((resolve, reject) => {
        const message = new Message({
            sender: user._id,
            receiver,
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

    socket.on("auth", ({ accessToken, refreshToken }) => {
        if (!accessToken || !refreshToken) {
            socket.emit(
                "messageError",
                "You are not authorized to send messages"
            );
            return;
        }

        //verify access token
        verifyAccessToken(accessToken)
            .then((user) => {
                //Access token is valid
                onlineUsers.push({ id: user._id, socketId: clientId });
                console.log(onlineUsers);
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

                            onlineUsers.push({
                                id: user._id,
                                socketId: clientId,
                            });
                            console.log(onlineUsers);
                        }
                    )
                    .catch((err) => {
                        socket.emit(
                            "messageError",
                            "You are not authorized to send messages"
                        );
                    });
            });
    });

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
        const { text, receiverId, senderId } = data;

        //get sender information

        User.findById(senderId)
            .then((user) => {
                //save message
                delete user.password;
                delete user.refreshToken;
                delete user.accessToken;
                saveMessage(text, user, receiverId)
                    .then((message) => {
                        //send message to receiver
                        const receiverSocketId = onlineUsers.find(
                            (user) => user.id === receiverId
                        ).socketId;
                        delete message.sender;
                        delete message.receiver;
                        const messageToSend = {
                            message,
                            receiver: {
                                _id: receiverId,
                            },
                            sender: user,
                        };
                        socket
                            .to(receiverSocketId)
                            .emit("newMessage", messageToSend);
                    })
                    .catch((err) => {
                        socket.emit("messageError", "Something went wrong");
                    });
            })
            .catch((err) => {
                console.log(err);
                socket.emit("messageError", "Something went wrong");
            });
    });
};
