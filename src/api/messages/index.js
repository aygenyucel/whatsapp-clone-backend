import express from "express";
import createHttpError from "http-errors";
import MessagesModel from "../messages/model.js";

const messagesRouter = express.Router();

messagesRouter.get("/", async (req, res, next) => {
  try {
    const messages = await MessagesModel.find({});
    res.send(messages);
  } catch (error) {
    next(error);
  }
});

messagesRouter.post("/", async (req, res, next) => {
  try {
    const newMessage = new MessagesModel(req.body);
    const { _id } = await newMessage.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

messagesRouter.get("/:messageId", async (req, res, next) => {
  try {
    const message = await MessagesModel.findById(req.params.messageId);
    if (message) {
      res.send(message);
    } else {
      next(
        createHttpError(
          404,
          `Message with id ${req.params.messageId} not found!`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

messagesRouter.put("/:messageId", async (req, res, next) => {
  try {
    const updatedMessage = await MessagesModel.findByIdAndUpdate(
      req.params.messageId,
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (updatedMessage) {
      res.status(204).send();
    } else {
      next(
        createHttpError(
          404,
          `Message with id ${req.params.messageId} not found!`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

messagesRouter.delete("/:messageId", async (req, res, next) => {
  try {
    const deletedMessage = await MessagesModel.findByIdAndDelete(
      req.params.messageId
    );

    if (deletedMessage) {
      res.status(204).send();
    } else {
      next(
        createHttpError(
          404,
          `Message with id ${req.params.messageId} not found!`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

export default messagesRouter;
