import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import {
    badRequestHandler,
    conflictErrorHandler,
    forbiddenErrorHandler,
    genericErrorHandler,
    notFoundHandler,
    unauthorizedErrorHandler,
} from "./errorHandlers.js";
import listEndpoints from "express-list-endpoints";
import chatsRouter from "./api/chats/index.js";
import messagesRouter from "./api/messages/index.js";
import usersRouter from "./api/Users/endpoint.js";
import passport from "passport";
import googleAuth from "./passport/google.js";
import dotenv from "dotenv";
import session from "express-session";
import { Server } from "socket.io";
import http from "http";
import { socketHandler } from "./socket/index.js";
import createHttpError from "http-errors";
dotenv.config();

const server = express();
const app = http.createServer(server);

const port = process.env.PORT || 3001;

//socket io, no long polling
const io = new Server(app, {
    transports: ["websocket"],
    //eio4
    origins: [process.env.FE_DEV_URL, process.env.FE_PROD_URL],
});

io.on("connection", socketHandler);
//on error
io.on("error", (err) => {
    console.log(err);
});

// ************************* MIDDLEWARES ****************************

const whitelist = [process.env.FE_DEV_URL, process.env.FE_PROD_URL];

server.use(
    cors({
        origin: (origin, corsNext) => {
            if (!origin || whitelist.indexOf(origin) !== -1) {
                corsNext(null, true);
            } else {
                corsNext(
                    createHttpError(
                        400,
                        `Cors Error! Your origin ${origin} is not in the list!`
                    )
                );
            }
        },
    })
);

if (!process.env.SESSION_SECRET) {
    throw new Error("Please set the SESSION_SECRET environment variable");
}

server.use(express.json());
server.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);

server.use(passport.initialize());
server.use(passport.session());
googleAuth(passport);

// ************************** ENDPOINTS *****************************
server.use("/users", usersRouter);

server.use("/chats", chatsRouter);
server.use("/messages", messagesRouter);
//************************** ERROR HANDLERS ************************
server.use(notFoundHandler);
server.use(badRequestHandler);
server.use(forbiddenErrorHandler);
server.use(conflictErrorHandler);
server.use(unauthorizedErrorHandler);
server.use(genericErrorHandler);

// **************************************************

mongoose.set("strictQuery", false);

mongoose.connect(process.env.MONGO_URL);

mongoose.connection.on("connected", () => {
    console.log("Successfully connected to Mongo!");
    app.listen(port, () => {
        console.table(listEndpoints(server));
        console.log("Server is running on port:", port);
    });
});
