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

const server = express();
const port = process.env.PORT || 3001;

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

server.use(express.json());

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
  server.listen(port, () => {
    console.table(listEndpoints(server));
    console.log("Server is running on port:", port);
  });
});
